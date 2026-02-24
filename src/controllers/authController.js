const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { userid, password } = req.body;

    // Hardcoded credentials as per requirement
    if (userid === 'admin' && password === '1234') {
        const token = jwt.sign(
            { id: 'admin', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token valid for 1 day
        );

        return res.json({
            success: true,
            token,
            user: {
                id: 'admin',
                name: 'Administrator'
            }
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
};
