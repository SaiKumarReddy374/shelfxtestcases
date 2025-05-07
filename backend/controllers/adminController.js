import db from "../db.js"; 

export const adminStatus = async (req, res) => {
    const { username, password } = req.body;
    try {
        const sql = "SELECT * FROM admin WHERE username = ?";
        const [results] = await db.query(sql, [username]);

        if (results.length > 0) {
            const admin = results[0];

            if (admin.password === password) {
                console.log('Login successful for:', username);
                 res.status(200).send({ message: 'Login successful'});
            } else {
                console.log('Invalid credentials for:', username);
                 res.status(401).send({ message: 'Invalid credentials' });
            }
        } else {
            console.log('User not found:', username);
             res.status(401).send({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send({ message: 'Server error' });
    }
};


