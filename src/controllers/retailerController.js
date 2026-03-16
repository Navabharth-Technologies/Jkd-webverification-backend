const { sql } = require('../config/db');

// Get all retailers with optional status filter
exports.getAllRetailers = async (req, res) => {
    try {
        const {
            status,
            state, district, town,
            period, startDate, endDate,
            staffId, isApplication,
            limit = 20,
            offset = 0
        } = req.query;

        console.log('DEBUG Retailer Filter:', { state, district, town });

        const request = new sql.Request();
        let whereClauses = [];

        // 1. Status Filter
        // 1. Status Filter
        if (status) {
            if (status === 'New') {
                whereClauses.push(`RST.Status = 'Auto-Approved' AND (RST.Remark IS NULL OR RST.Remark = '')`);
            } else if (status === 'Approved') {
                whereClauses.push(`RST.Status = 'Approved' AND (RST.Remark IS NOT NULL AND RST.Remark <> '')`);
            } else if (status === 'Self-Registered') {
                // Filter for Self-Registered Users (Not starting with JKD and not NULL if we assume only valid users, 
                // but based on previous logic: UserId NOT LIKE 'JKD%' OR UserId IS NULL)
                whereClauses.push("(R.UserId IS NULL OR NOT R.UserId LIKE 'JKD%')");
            } else {
                whereClauses.push(`RST.Status = @status`);
                request.input('status', sql.VarChar, status);
            }
        }

        // 2. Region Filters
        // 2. Region Filters
        if (state && state !== 'undefined' && state !== 'null') {
            const stateTerm = state.trim();
            whereClauses.push("((R.State IS NOT NULL AND R.State = @state) OR (R.AddressLine1 IS NOT NULL AND R.AddressLine1 LIKE '%' + @state + '%') OR (R.AddressLine2 IS NOT NULL AND R.AddressLine2 LIKE '%' + @state + '%'))");
            request.input('state', sql.VarChar, stateTerm);
        }
        if (district && district !== 'undefined' && district !== 'null') {
            const districtTerm = district.trim();
            whereClauses.push("((R.District IS NOT NULL AND R.District LIKE '%' + @district + '%') OR (R.AddressLine1 IS NOT NULL AND R.AddressLine1 LIKE '%' + @district + '%') OR (R.AddressLine2 IS NOT NULL AND R.AddressLine2 LIKE '%' + @district + '%'))");
            request.input('district', sql.VarChar, districtTerm);
        }
        if (town && town !== 'undefined' && town !== 'null') {
            const townTerm = town.trim();
            // Handle 'nagar' vs 'nagara' by allowing optional trailing 'a'
            const townBase = townTerm.endsWith('a') ? townTerm.slice(0, -1) : townTerm;

            whereClauses.push(`(
                (R.Town IS NOT NULL AND (R.Town LIKE '%' + @town + '%' OR R.Town LIKE '%' + @townBase + '%')) OR 
                (R.AddressLine1 IS NOT NULL AND (R.AddressLine1 LIKE '%' + @town + '%' OR R.AddressLine1 LIKE '%' + @townBase + '%')) OR 
                (R.AddressLine2 IS NOT NULL AND (R.AddressLine2 LIKE '%' + @town + '%' OR R.AddressLine2 LIKE '%' + @townBase + '%'))
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
                    dateFilter = "CAST(RST.UpdatedAt AS DATE) = CAST(GETDATE() AS DATE)";
                    break;
                case 'week':
                    dateFilter = "RST.UpdatedAt >= DATEADD(day, -7, GETDATE())";
                    break;
                case 'month':
                    dateFilter = "MONTH(RST.UpdatedAt) = MONTH(GETDATE()) AND YEAR(RST.UpdatedAt) = YEAR(GETDATE())";
                    break;
                case 'year':
                    dateFilter = "YEAR(RST.UpdatedAt) = YEAR(GETDATE())";
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        dateFilter = "RST.UpdatedAt BETWEEN @startDate AND @endDate";
                        request.input('startDate', sql.Date, startDate);
                        request.input('endDate', sql.Date, endDate);
                    }
                    break;
            }
            if (dateFilter) whereClauses.push(dateFilter);
        }

        // 5. Retailer Application Filter (UserId exists in RegistrationType as Retailer OR UserId is NULL)
        if (isApplication === 'true' || isApplication === true) {
            whereClauses.push("(R.UserId IN (SELECT UserId FROM [onboarding].RegistrationType WHERE BusinessType = 'Retailer') OR R.UserId IS NULL)");
        } else if (staffId) {
            // 4. Staff Filter (Only if NOT looking for Applications, to avoid conflict if logic overlaps)
            whereClauses.push("R.UserId = @staffId");
            request.input('staffId', sql.VarChar, staffId);
        } else {
            // Optional: If neither filter is active, we show ALL. 
            // If we wanted to hide Applications by default, we'd add "R.UserId NOT IN (...)" here.
            // For now, we show everything by default.
        }

        const whereString = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

        let query = `
            WITH LatestStatus AS (
                SELECT 
                    RetailerId, Status, Remark, UpdatedAt,
                    ROW_NUMBER() OVER (PARTITION BY RetailerId ORDER BY UpdatedAt DESC) as rn
                FROM [onboarding].RetailerStatusTracking WITH (NOLOCK)
            )
            SELECT 
                R.RetailerId, 
                R.ShopName, 
                R.RetailerName, 
                R.AddressLine1,
                R.AddressLine2,
                R.State,
                R.District,
                R.Town,
                R.Location,
                RST.Status,
                R.CreatedAt as OnboardingDate,
                COUNT(*) OVER() as TotalCount
            FROM [onboarding].Retailers R WITH (NOLOCK)
            LEFT JOIN LatestStatus RST ON R.RetailerId = RST.RetailerId AND RST.rn = 1
            ${whereString}
            ORDER BY RST.UpdatedAt DESC 
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
        console.error('Error fetching retailers:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single retailer details
exports.getRetailerById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        // 1. Get Retailer Basic Info + OnboardedBy + Current Status Info
        const retailerResult = await request.query(`
            SELECT 
                R.*, 
                U.FullName as StaffUsername,
                RT.BusinessType as RegType,
                RST.Status as DbStatus,
                RST.Remark as DbRemark,
                R.CreatedAt as OnboardingDate
            FROM [onboarding].Retailers R WITH (NOLOCK)
            LEFT JOIN [onboarding].Users U WITH (NOLOCK) ON R.UserId = U.UserId
            LEFT JOIN [onboarding].RegistrationType RT WITH (NOLOCK) ON R.UserId = RT.UserId
            LEFT JOIN [onboarding].RetailerStatusTracking RST WITH (NOLOCK) ON R.RetailerId = RST.RetailerId
            WHERE R.RetailerId = @id
        `);

        if (retailerResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Retailer not found' });
        }

        const rawData = retailerResult.recordset[0];

        // Calculate dynamic fields for Frontend
        const displayStatus = rawData.DbStatus || 'Auto-Approved';

        const approvedBy = (rawData.DbStatus === 'Approved' && rawData.DbRemark && rawData.DbRemark.trim() !== '')
            ? 'Admin'
            : '';

        // If RegType is Retailer OR UserId is NULL (orphaned application), it's a Self-Registration
        // If UserId starts with 'JKD', it is a Staff Member (Onboarding Team)
        // Otherwise, it is a Self-Registration (Retailer Application)
        const onboardedBy = (rawData.UserId && rawData.UserId.toString().toUpperCase().startsWith('JKD'))
            ? (rawData.StaffUsername || 'Unknown Staff')
            : 'Retailer Application';

        // Logic for Reason: Hide 'New Registration' if Pending
        let displayReason = rawData.DbRemark || '';
        if (displayStatus === 'Pending' && displayReason === 'New Registration') {
            displayReason = '';
        }

        const retailer = {
            ...rawData,
            CurrentStatus: displayStatus, // Keeping existing field but with new logic
            status: displayStatus,
            approvedBy: approvedBy,
            reason: displayReason,
            onboardedBy: onboardedBy
        };

        // 2. Get Photos Metadata (IDs only to keep payload light)
        const photosResult = await request.query(`
            SELECT PhotoId, PhotoType, UploadedAt 
            FROM [onboarding].RetailerShopPhotos 
            WHERE RetailerId = @id
        `);

        // 3. Get Documents Metadata
        const docsResult = await request.query(`
            SELECT DocumentId, DocumentType, UploadedAt 
            FROM [onboarding].RetailerDocuments 
            WHERE RetailerId = @id
        `);

        // 4. Get Status History
        const historyResult = await request.query(`
            SELECT Status, Remark, UpdatedAt 
            FROM [onboarding].RetailerStatusTracking 
            WHERE RetailerId = @id 
            ORDER BY UpdatedAt DESC
        `);

        res.json({
            success: true,
            data: {
                ...retailer,
                photos: photosResult.recordset,
                documents: docsResult.recordset,
                statusHistory: historyResult.recordset
            }
        });

    } catch (err) {
        console.error('Error fetching retailer details:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Photo Content
exports.getRetailerPhoto = async (req, res) => {
    try {
        const { id } = req.params; // PhotoId
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        const result = await request.query(`SELECT ShopPhoto FROM [onboarding].RetailerShopPhotos WHERE PhotoId = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Photo not found');
        }

        const photoBuffer = result.recordset[0].ShopPhoto;
        res.writeHead(200, {
            'Content-Type': 'image/jpeg', // Assuming JPEG, or could detect
            'Content-Length': photoBuffer.length
        });
        res.end(photoBuffer);
    } catch (err) {
        console.error('Error fetching photo:', err);
        res.status(500).send('Server error');
    }
};

// Get Document Content
exports.getRetailerDocument = async (req, res) => {
    try {
        const { id } = req.params; // DocumentId
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);

        const result = await request.query(`SELECT DocumentFile, DocumentType FROM [onboarding].RetailerDocuments WHERE DocumentId = @id`);

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
        const { id } = req.params; // RetailerId
        const { status, remark } = req.body; // status: 'Approved', 'Rejected', 'Pending'

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // We need UserId to update RegistrationType
        // Let's first fetch UserId
        const requestPre = new sql.Request();
        requestPre.input('id', sql.VarChar, id);
        const retailerRes = await requestPre.query('SELECT UserId FROM [onboarding].Retailers WHERE RetailerId = @id');

        if (retailerRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Retailer not found' });
        }
        const userId = retailerRes.recordset[0].UserId;

        await transaction.begin();

        const request = new sql.Request(transaction);
        request.input('userId', sql.VarChar, userId);
        request.input('retailerId', sql.VarChar, id);
        request.input('status', sql.VarChar, status);
        request.input('remark', sql.VarChar, remark || '');

        // 1. Update RegistrationType (Main Status) - Skipped to keep Tracking Table as Source of Truth
        /*
        await request.query(`
            UPDATE RegistrationType 
            SET Status = @status 
            WHERE UserId = @userId AND BusinessType = 'Retailer'
        `);
        */

        // 2. Insert into RetailerStatusTracking (Audit)
        const approvedBy = (status === 'Approved') ? 'Admin' : null;
        request.input('approvedBy', sql.VarChar, approvedBy);

        await request.query(`
            IF EXISTS (SELECT 1 FROM [onboarding].RetailerStatusTracking WHERE RetailerId = @retailerId)
            BEGIN
                UPDATE [onboarding].RetailerStatusTracking 
                SET Status = @status, Remark = @remark, ApprovedBy = @approvedBy, UpdatedAt = GETDATE()
                WHERE RetailerId = @retailerId
            END
            ELSE
            BEGIN
                INSERT INTO [onboarding].RetailerStatusTracking (RetailerId, Status, Remark, ApprovedBy, UpdatedAt)
                VALUES (@retailerId, @status, @remark, @approvedBy, GETDATE())
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
exports.getRetailerStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) as Approved,
                SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) as Pending,
                SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
                COUNT(*) as Total
            FROM [onboarding].RetailerStatusTracking
        `;

        const request = new sql.Request();
        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error fetching retailer stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
