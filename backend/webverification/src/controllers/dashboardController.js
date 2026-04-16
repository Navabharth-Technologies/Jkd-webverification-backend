const { sql } = require('../config/db');
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');

// Helper to build date filter
const getDateFilter = (period, startDate, endDate, columnName = 'T.UpdatedAt') => {
    let filter = '';
    switch (period) {
        case 'day':
            filter = `CAST(${columnName} AS DATE) = CAST(GETDATE() AS DATE)`;
            break;
        case 'week':
            filter = `${columnName} >= DATEADD(day, -7, GETDATE())`;
            break;
        case 'month':
            filter = `MONTH(${columnName}) = MONTH(GETDATE()) AND YEAR(${columnName}) = YEAR(GETDATE())`;
            break;
        case 'year':
            filter = `YEAR(${columnName}) = YEAR(GETDATE())`;
            break;
        case 'custom':
            if (startDate && endDate) {
                filter = `${columnName} BETWEEN @startDate AND @endDate`;
            }
            break;
        default:
            filter = "1=1"; // No time filter
    }
    return filter;
};

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const { period, startDate, endDate, state, district, town } = req.query;

        const request = new sql.Request();
        let whereClauses = [];
        // Region Filters
        if (state) {
            whereClauses.push("R.State = @state");
            request.input('state', sql.VarChar, state);
        }
        if (district) {
            whereClauses.push("R.District LIKE '%' + @district + '%'");
            request.input('district', sql.VarChar, district);
        }
        if (town) {
            whereClauses.push("R.Town LIKE '%' + @town + '%'");
            request.input('town', sql.VarChar, town);
        }

        // Time Filter (Retailer Query)
        const retailerDateFilter = getDateFilter(period, startDate, endDate, 'R.CreatedAt');
        let retailerWhereClauses = [...whereClauses];
        if (retailerDateFilter !== '1=1') {
            retailerWhereClauses.push(retailerDateFilter);
            if (period === 'custom') {
                request.input('startDate', sql.Date, startDate);
                request.input('endDate', sql.Date, endDate);
            }
        }

        // Time Filter (Vendor Query)
        // Need to adjust whereClauses prefix for Vendors if it was 'R.'
        let adjustedVendorWhereClauses = whereClauses.map(c => c.replace(/R\./g, 'V.'));
        const vendorDateFilter = getDateFilter(period, startDate, endDate, 'V.CreatedAt');
        let vendorWhereClauses = [...adjustedVendorWhereClauses];
        if (vendorDateFilter !== '1=1') {
            vendorWhereClauses.push(vendorDateFilter);
        }

        const retailerWhereString = retailerWhereClauses.length > 0 ? "WHERE " + retailerWhereClauses.join(" AND ") : "";
        const vendorWhereString = vendorWhereClauses.length > 0 ? "WHERE " + vendorWhereClauses.join(" AND ") : "";

        // Query for Retailers
        const retailerQuery = `
            SELECT 
                SUM(CASE WHEN T.Status = 'Approved' AND (T.Remark IS NOT NULL AND T.Remark <> '') THEN 1 ELSE 0 END) as Approved,
                SUM(CASE WHEN T.Status = 'Pending' THEN 1 ELSE 0 END) as Pending,
                SUM(CASE WHEN T.Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
                SUM(CASE WHEN T.Status = 'Auto-Approved' AND (T.Remark IS NULL OR T.Remark = '') THEN 1 ELSE 0 END) as New
            FROM [onboarding].Retailers R
            JOIN [onboarding].RetailerStatusTracking T ON R.RetailerId = T.RetailerId
            ${retailerWhereString}
        `;

        // Query for Vendors
        const vendorQuery = `
            SELECT 
                SUM(CASE WHEN T.Status = 'Approved' AND (T.Remark IS NOT NULL AND T.Remark <> '') THEN 1 ELSE 0 END) as Approved,
                SUM(CASE WHEN T.Status = 'Pending' THEN 1 ELSE 0 END) as Pending,
                SUM(CASE WHEN T.Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
                SUM(CASE WHEN T.Status = 'Auto-Approved' AND (T.Remark IS NULL OR T.Remark = '') THEN 1 ELSE 0 END) as New
            FROM [onboarding].Vendors V
            JOIN [onboarding].VendorStatusTracking T ON V.VendorId = T.VendorId
            ${vendorWhereString}
        `;

        const retailerResult = await request.query(retailerQuery);

        // Re-calculate inputs for Vendor query if needed (request can be reused usually)
        const vendorResult = await request.query(vendorQuery);

        // Query for Products
        const productDateFilter = getDateFilter(period, startDate, endDate, 'P.CreatedAt');
        let productWhereClauses = [];
        if (productDateFilter !== '1=1') {
            productWhereClauses.push(productDateFilter);
        }
        const productWhereString = productWhereClauses.length > 0 ? "WHERE " + productWhereClauses.join(" AND ") : "";

        const productQuery = `
            SELECT 
                SUM(CASE WHEN P.Status = 'Approved' THEN 1 ELSE 0 END) as Approved,
                SUM(CASE WHEN P.Status = 'Pending' OR P.Status IS NULL THEN 1 ELSE 0 END) as Pending,
                SUM(CASE WHEN P.Status = 'Rejected' THEN 1 ELSE 0 END) as Rejected,
                COUNT(*) as Total
            FROM [onboarding].Products P
            LEFT JOIN [onboarding].Vendors V ON P.VendorId = V.VendorId
            ${productWhereString}
        `;
        const productResult = await request.query(productQuery);

        res.json({
            success: true,
            data: {
                retailers: retailerResult.recordset[0] || { Approved: 0, Pending: 0, Rejected: 0, New: 0 },
                vendors: vendorResult.recordset[0] || { Approved: 0, Pending: 0, Rejected: 0, New: 0 },
                products: productResult.recordset[0] || { Approved: 0, Pending: 0, Rejected: 0, Total: 0 }
            }
        });


    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Dashboard Drill-down Details
exports.getDashboardDetails = async (req, res) => {
    try {
        const { type, status, period, startDate, endDate, state, district, town } = req.query;
        // type: 'retailer' or 'vendor'
        // status: 'Approved', 'Pending', 'Rejected', 'New'

        const request = new sql.Request();
        let whereClauses = [];

        // Base Status Filter
        if (status === 'New') {
            whereClauses.push("T.Status = 'Auto-Approved' AND (T.Remark IS NULL OR T.Remark = '')");
        } else if (status === 'Approved') {
            whereClauses.push("T.Status = 'Approved' AND (T.Remark IS NOT NULL AND T.Remark <> '')");
        } else {
            whereClauses.push("T.Status = @status");
            request.input('status', sql.VarChar, status);
        }

        // Time Filter
        const dateFilter = getDateFilter(period, startDate, endDate, 'Base.CreatedAt');
        if (dateFilter !== '1=1') {
            whereClauses.push(dateFilter);
            if (period === 'custom') {
                request.input('startDate', sql.Date, startDate);
                request.input('endDate', sql.Date, endDate);
            }
        }

        // Region Filters
        if (state) {
            whereClauses.push("Base.State = @state");
            request.input('state', sql.VarChar, state);
        }
        if (district) {
            whereClauses.push("Base.District LIKE '%' + @district + '%'");
            request.input('district', sql.VarChar, district);
        }
        if (town) {
            whereClauses.push("Base.Town LIKE '%' + @town + '%'");
            request.input('town', sql.VarChar, town);
        }

        const whereString = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
        let query;

        if (type === 'retailer') {
            query = `
                SELECT Base.RetailerId as id, Base.ShopName as name
                FROM [onboarding].Retailers AS Base
                JOIN [onboarding].RetailerStatusTracking T ON Base.RetailerId = T.RetailerId
                ${whereString}
            `;
        } else {
            query = `
                SELECT Base.VendorId as id, Base.BusinessName as name
                FROM [onboarding].Vendors AS Base
                JOIN [onboarding].VendorStatusTracking T ON Base.VendorId = T.VendorId
                ${whereString}
            `;
        }

        const result = await request.query(query);

        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching dashboard details:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Export Dashboard Statistics to PDF or Excel
exports.exportDashboardPdf = async (req, res) => {
    try {
        const { period, startDate, endDate, state, district, town, format = 'pdf' } = req.query;
        const request = new sql.Request();
        let whereClauses = [];

        // Time Filter
        const dateFilter = getDateFilter(period, startDate, endDate, 'Base.CreatedAt');
        if (dateFilter !== '1=1') {
            whereClauses.push(dateFilter);
            if (period === 'custom') {
                request.input('startDate', sql.Date, startDate);
                request.input('endDate', sql.Date, endDate);
            }
        }

        // Region Filters
        if (state) {
            whereClauses.push("Base.State = @state");
            request.input('state', sql.VarChar, state);
        }
        if (district) {
            whereClauses.push("Base.District LIKE '%' + @district + '%'");
            request.input('district', sql.VarChar, district);
        }
        if (town) {
            whereClauses.push("Base.Town LIKE '%' + @town + '%'");
            request.input('town', sql.VarChar, town);
        }

        const whereString = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

        // Query for Retailers
        const retailerQuery = `
            SELECT 
                Base.ShopName as Name,
                'Retailer' as Type,
                Base.Town, Base.District, Base.State,
                T.Status, Base.CreatedAt as Date,
                U.FullName as StaffName
            FROM [onboarding].Retailers Base
            JOIN [onboarding].RetailerStatusTracking T ON Base.RetailerId = T.RetailerId
            LEFT JOIN [onboarding].Users U ON Base.UserId = U.UserId
            ${whereString}
        `;

        // Query for Vendors
        const vendorQuery = `
            SELECT 
                Base.BusinessName as Name,
                'Vendor' as Type,
                Base.Town, Base.District, Base.State,
                T.Status, Base.CreatedAt as Date,
                U.FullName as StaffName
            FROM [onboarding].Vendors Base
            JOIN [onboarding].VendorStatusTracking T ON Base.VendorId = T.VendorId
            LEFT JOIN [onboarding].Users U ON Base.UserId = U.UserId
            ${whereString}
        `;

        const [retailerRes, vendorRes] = await Promise.all([
            request.query(retailerQuery),
            request.query(vendorQuery)
        ]);

        // Merge and Sort by Date Descending
        const allData = [
            ...retailerRes.recordset,
            ...vendorRes.recordset
        ].sort((a, b) => new Date(b.Date) - new Date(a.Date));

        // Format: EXCEL
        if (format.toLowerCase() === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Registration Summary');

            // Header Row
            worksheet.columns = [
                { header: 'SL', key: 'sl', width: 5 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Shop/Business Name', key: 'name', width: 30 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'Region', key: 'region', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Onboarded by', key: 'staff', width: 25 }
            ];

            // Style Header
            worksheet.getRow(1).font = { bold: true };

            // Add Rows
            allData.forEach((row, index) => {
                worksheet.addRow({
                    sl: index + 1,
                    date: new Date(row.Date).toLocaleDateString('en-IN'),
                    name: row.Name || 'N/A',
                    type: row.Type,
                    region: `${row.Town}, ${row.District}, ${row.State}`,
                    status: row.Status,
                    staff: row.StaffName || "Retailer Application"
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=DashboardReport.xlsx');

            return await workbook.xlsx.write(res);
        }

        // Default Format: PDF
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=DashboardReport.pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('JKD MART - Analytics Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Retailer & Vendor Registration Details', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        const table = {
            title: "Registration Summary",
            headers: ["SL", "Date", "Shop/Business Name", "Type", "Region", "Status", "Onboarded by"],
            rows: allData.map((row, index) => [
                (index + 1).toString(),
                new Date(row.Date).toLocaleDateString('en-IN'),
                row.Name || 'N/A',
                row.Type,
                `${row.Town}, ${row.District}, ${row.State}`,
                row.Status,
                row.StaffName || "Retailer Application"
            ])
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: () => doc.font("Helvetica").fontSize(9),
        });

        doc.end();

    } catch (err) {
        console.error('Error in export:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
