const { sql } = require('../config/db');

// Get all products with optional filters
exports.getAllProducts = async (req, res) => {
    try {
        const { status, vendorId, limit = 20, offset = 0 } = req.query;
        const request = new sql.Request();
        let whereClauses = [];

        if (status) {
            whereClauses.push("P.Status = @status");
            request.input('status', sql.VarChar, status);
        }
        if (vendorId) {
            whereClauses.push("P.VendorId = @vendorId");
            request.input('vendorId', sql.Int, vendorId);
        }

        const whereString = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

        const query = `
            SELECT 
                P.ProductId, P.ProductName, P.SKU, P.BrandModel, 
                P.Status, P.CreatedAt,
                V.BusinessName as VendorName,
                COUNT(*) OVER() as TotalCount
            FROM [onboarding].Products P WITH (NOLOCK)
            LEFT JOIN [onboarding].Vendors V WITH (NOLOCK) ON P.VendorId = V.VendorId
            ${whereString}
            ORDER BY P.CreatedAt DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
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
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single product details
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const productResult = await request.query(`
            SELECT P.*, V.BusinessName as VendorName
            FROM [onboarding].Products P WITH (NOLOCK)
            LEFT JOIN [onboarding].Vendors V WITH (NOLOCK) ON P.VendorId = V.VendorId
            WHERE P.ProductId = @id
        `);

        if (productResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const product = productResult.recordset[0];

        // Get images
        const imagesResult = await request.query(`
            SELECT ImageId, ImageType, UploadedAt 
            FROM [onboarding].ProductImages 
            WHERE ProductId = @id
        `);

        // Get attributes
        const attributesResult = await request.query(`
            SELECT AttributeId, AttributeName, AttributeValue 
            FROM [onboarding].ProductAttributes 
            WHERE ProductId = @id
        `);

        res.json({
            success: true,
            data: {
                ...product,
                images: imagesResult.recordset,
                attributes: attributesResult.recordset
            }
        });
    } catch (err) {
        console.error('Error fetching product details:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update product status
exports.updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remark } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('status', sql.VarChar, status);
        request.input('remark', sql.VarChar, remark || '');

        await request.query(`
            UPDATE [onboarding].Products 
            SET Status = @status, 
                StatusRemark = @remark,
                UpdatedAt = GETDATE()
            WHERE ProductId = @id
        `);

        res.json({ success: true, message: 'Product status updated successfully' });
    } catch (err) {
        console.error('Error updating product status:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Serve product image
exports.getProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const result = await request.query(`SELECT ProductImage FROM [onboarding].ProductImages WHERE ImageId = @id`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Image not found');
        }

        const imageBuffer = result.recordset[0].ProductImage;
        if (!imageBuffer) return res.status(404).send('Image data is empty');

        let contentType = 'image/jpeg'; // Default
        if (imageBuffer.length > 4 && imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
            contentType = 'image/png';
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);
    } catch (err) {
        console.error('Error serving product image:', err);
        res.status(500).send('Server error');
    }
};

