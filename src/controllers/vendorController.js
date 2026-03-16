const { sql } = require('../config/db');

// Get all vendors with optional status filter
exports.getAllVendors = async (req, res) => {
    try {
        const {
            status,
            state, district, town,
            period, startDate, endDate,
            staffId,
            limit = 20,
            offset = 0
        } = req.query;

        const request = new sql.Request();
        let whereClauses = [];

        // 1. Status Filter
        if (status) {
            if (status === 'New') {
                whereClauses.push(`VST.Status = 'Auto-Approved' AND (VST.Remark IS NULL OR VST.Remark = '')`);
            } else if (status === 'Approved') {
                whereClauses.push(`VST.Status = 'Approved' AND (VST.Remark IS NOT NULL AND VST.Remark <> '')`);
            } else {
                whereClauses.push(`VST.Status = @status`);
                request.input('status', sql.VarChar, status);
            }
        }

        // 2. Region Filters
        // 2. Region Filters
        if (state && state !== 'undefined' && state !== 'null') {
            const stateTerm = state.trim();
            whereClauses.push("((V.State IS NOT NULL AND V.State = @state) OR (V.AddressLine1 IS NOT NULL AND V.AddressLine1 LIKE '%' + @state + '%') OR (V.AddressLine2 IS NOT NULL AND V.AddressLine2 LIKE '%' + @state + '%'))");
            request.input('state', sql.VarChar, stateTerm);
        }
        if (district && district !== 'undefined' && district !== 'null') {
            const districtTerm = district.trim();
            whereClauses.push("((V.District IS NOT NULL AND V.District LIKE '%' + @district + '%') OR (V.AddressLine1 IS NOT NULL AND V.AddressLine1 LIKE '%' + @district + '%') OR (V.AddressLine2 IS NOT NULL AND V.AddressLine2 LIKE '%' + @district + '%'))");
            request.input('district', sql.VarChar, districtTerm);
        }
        if (town && town !== 'undefined' && town !== 'null') {
            const townTerm = town.trim();
            // Handle 'nagar' vs 'nagara' by allowing optional trailing 'a'
            const townBase = townTerm.endsWith('a') ? townTerm.slice(0, -1) : townTerm;

            whereClauses.push(`(
                (V.Town IS NOT NULL AND (V.Town LIKE '%' + @town + '%' OR V.Town LIKE '%' + @townBase + '%')) OR 
                (V.AddressLine1 IS NOT NULL AND (V.AddressLine1 LIKE '%' + @town + '%' OR V.AddressLine1 LIKE '%' + @townBase + '%')) OR 
                (V.AddressLine2 IS NOT NULL AND (V.AddressLine2 LIKE '%' + @town + '%' OR V.AddressLine2 LIKE '%' + @townBase + '%'))
            )`);
            request.input('town', sql.VarChar, townTerm);
            request.input('townBase', sql.VarChar, townBase);
        }

        // 3. Date Filters (Based on UpdatedAt in Tracking table)
        if (period || (startDate && endDate)) {
            let dateFilter = '';
            switch (period) {
                case 'today':
                case 'day':
                    dateFilter = "CAST(VST.UpdatedAt AS DATE) = CAST(GETDATE() AS DATE)";
                    break;
                case 'week':
                    dateFilter = "VST.UpdatedAt >= DATEADD(day, -7, GETDATE())";
                    break;
                case 'month':
                    dateFilter = "MONTH(VST.UpdatedAt) = MONTH(GETDATE()) AND YEAR(VST.UpdatedAt) = YEAR(GETDATE())";
                    break;
                case 'year':
                    dateFilter = "YEAR(VST.UpdatedAt) = YEAR(GETDATE())";
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        dateFilter = "VST.UpdatedAt BETWEEN @startDate AND @endDate";
                        request.input('startDate', sql.Date, startDate);
                        request.input('endDate', sql.Date, endDate);
                    }
                    break;
            }
            if (dateFilter) whereClauses.push(dateFilter);
        }

        // 4. Staff Filter
        if (staffId) {
            whereClauses.push("V.UserId = @staffId");
            request.input('staffId', sql.VarChar, staffId);
        }

        const whereString = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

        let query = `
            SELECT 
                V.VendorId, 
                V.BusinessName, 
                V.VendorName, 
                V.AddressLine1,
                V.AddressLine2,
                V.State,
                V.District,
                V.Town,
                V.Market,
                V.Location,
                VST.Status,
                V.CreatedAt as OnboardingDate,
                COUNT(*) OVER() as TotalCount
            FROM [onboarding].Vendors V
            LEFT JOIN [onboarding].VendorStatusTracking VST ON V.VendorId = VST.VendorId
            ${whereString}
            ORDER BY VST.UpdatedAt DESC 
            OFFSET @offset ROWS 
            FETCH NEXT @limit ROWS ONLY
        `;

        request.input('limit', sql.Int, parseInt(limit));
        request.input('offset', sql.Int, parseInt(offset));

        const result = await request.query(query);

        const total = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;

        res.json({
            success: true,
            count: result.recordset.length,
            total: total,
            data: result.recordset.map(row => {
                const { TotalCount, ...data } = row;
                return data;
            })
        });
    } catch (err) {
        console.error('Error fetching vendors:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single vendor details
exports.getVendorById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        // 1. Get Vendor Basic Info + OnboardedBy + Current Status Info
        const vendorResult = await request.query(`
            SELECT 
                V.*, 
                U.FullName as StaffUsername,
                VST.Status as DbStatus,
                VST.Remark as DbRemark,
                V.CreatedAt as OnboardingDate
            FROM [onboarding].Vendors V
            LEFT JOIN [onboarding].Users U ON V.UserId = U.UserId
            LEFT JOIN [onboarding].VendorStatusTracking VST ON V.VendorId = VST.VendorId
            WHERE V.VendorId = @id
        `);

        if (vendorResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }

        const rawData = vendorResult.recordset[0];

        // Calculate dynamic fields for Frontend
        const displayStatus = rawData.DbStatus || 'Auto-Approved';

        const approvedBy = (rawData.DbStatus === 'Approved' && rawData.DbRemark && rawData.DbRemark.trim() !== '')
            ? 'Admin'
            : '';

        const onboardedBy = rawData.StaffUsername || 'Staff Onboarded'; // Fallback since vendors only onboard via staff

        const vendor = {
            ...rawData,
            CurrentStatus: displayStatus,
            status: displayStatus,
            approvedBy: approvedBy,
            reason: rawData.DbRemark || '',
            onboardedBy: onboardedBy
        };

        // 2. Get Photos Metadata
        const photosResult = await request.query(`
            SELECT PhotoId, PhotoType, UploadedAt 
            FROM [onboarding].VendorBusinessPhotos 
            WHERE VendorId = @id
        `);

        // 3. Get Documents Metadata
        const docsResult = await request.query(`
            SELECT DocumentId, DocumentType, UploadedAt 
            FROM [onboarding].VendorDocuments 
            WHERE VendorId = @id
        `);

        // 4. Get Status History
        const historyResult = await request.query(`
            SELECT Status, Remark, UpdatedAt 
            FROM [onboarding].VendorStatusTracking 
            WHERE VendorId = @id 
            ORDER BY UpdatedAt DESC
        `);

        res.json({
            success: true,
            data: {
                ...vendor,
                photos: photosResult.recordset,
                documents: docsResult.recordset,
                statusHistory: historyResult.recordset
            }
        });

    } catch (err) {
        console.error('Error fetching vendor details:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Photo Content
exports.getVendorPhoto = async (req, res) => {
    try {
        const { id } = req.params; // PhotoId
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        const result = await request.query(`SELECT BusinessPhoto FROM [onboarding].VendorBusinessPhotos WHERE PhotoId = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Photo not found');
        }

        const photoBuffer = result.recordset[0].BusinessPhoto;
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': photoBuffer.length
        });
        res.end(photoBuffer);
    } catch (err) {
        console.error('Error fetching photo:', err);
        res.status(500).send('Server error');
    }
};

// Get Document Content
exports.getVendorDocument = async (req, res) => {
    try {
        const { id } = req.params; // DocumentId
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        const result = await request.query(`SELECT DocumentFile, DocumentType FROM [onboarding].VendorDocuments WHERE DocumentId = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Document not found');
        }

        const docBuffer = result.recordset[0].DocumentFile;
        // Determine content type from magic numbers
        let contentType = 'application/octet-stream';
        if (docBuffer.length > 3 && docBuffer[0] === 0xFF && docBuffer[1] === 0xD8 && docBuffer[2] === 0xFF) {
            contentType = 'image/jpeg';
        } else if (docBuffer.length > 4 && docBuffer[0] === 0x89 && docBuffer[1] === 0x50 && docBuffer[2] === 0x4E && docBuffer[3] === 0x47) {
            contentType = 'image/png';
        } else if (docBuffer.length > 4 && docBuffer[0] === 0x25 && docBuffer[1] === 0x50 && docBuffer[2] === 0x44 && docBuffer[3] === 0x46) {
            contentType = 'application/pdf';
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': docBuffer.length
        });
        res.end(docBuffer);
    } catch (err) {
        console.error('Error fetching document:', err);
        res.status(500).send('Server error');
    }
};

// Update Status
exports.updateStatus = async (req, res) => {
    const transaction = new sql.Transaction();
    try {
        const { id } = req.params; // VendorId
        const { status, remark } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const requestPre = new sql.Request();
        requestPre.input('id', sql.VarChar, id);
        const vendorRes = await requestPre.query('SELECT UserId FROM [onboarding].Vendors WHERE VendorId = @id');

        if (vendorRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        const userId = vendorRes.recordset[0].UserId;

        await transaction.begin();

        const request = new sql.Request(transaction);
        request.input('userId', sql.VarChar, userId);
        request.input('vendorId', sql.VarChar, id);
        request.input('status', sql.VarChar, status);
        request.input('remark', sql.VarChar, remark || '');

        // Update RegistrationType (Main Status) - Skipped to keep Tracking Table as Source of Truth
        /*
        await request.query(`
            UPDATE RegistrationType 
            SET Status = @status 
            WHERE UserId = @userId AND BusinessType = 'Vendor'
        `);
        */

        // Insert into VendorStatusTracking (Audit)
        const approvedBy = (status === 'Approved') ? 'Admin' : null;
        request.input('approvedBy', sql.VarChar, approvedBy);

        await request.query(`
            IF EXISTS (SELECT 1 FROM [onboarding].VendorStatusTracking WHERE VendorId = @vendorId)
            BEGIN
                UPDATE [onboarding].VendorStatusTracking 
                SET Status = @status, Remark = @remark, ApprovedBy = @approvedBy, UpdatedAt = GETDATE()
                WHERE VendorId = @vendorId
            END
            ELSE
            BEGIN
                INSERT INTO [onboarding].VendorStatusTracking (VendorId, Status, Remark, ApprovedBy, UpdatedAt)
                VALUES (@vendorId, @status, @remark, @approvedBy, GETDATE())
            END
        `);

        await transaction.commit();

        res.json({ success: true, message: 'Status updated successfully' });

    } catch (err) {
        console.error('Error updating status:', err);
        if (transaction._aborted === false) {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Status Statistics
exports.getVendorStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as Approved,
                SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as Pending,
                SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
                COUNT(*) as Total
            FROM [onboarding].VendorStatusTracking
        `;

        const request = new sql.Request();
        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error fetching vendor stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
