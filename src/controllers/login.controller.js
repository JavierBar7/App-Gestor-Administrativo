const {Usuario} = require('../models/Usuario');

const login = async (req,res) => {
    try {
        const {username, password} = req.body;
        const user = await Usuario.findUserAndPassword(username, password);

        if (!user) {
            return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }

        await Usuario.updateLastLogin(user.id);
        
        return res.json({ success: true, role: user.rolName });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
}

module.exports = login;
