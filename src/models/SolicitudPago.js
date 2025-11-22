const conn = require('../../config/database');

class SolicitudPago {
    /**
     * Create a new payment request record
     * @param {Object} data - { idEstudiante, Tipo_Solicitud, Fecha_Solicitud, Notas }
     * @returns {Promise<number>} - ID of created solicitud
     */
    static async createSolicitud(data) {
        const { idEstudiante, Tipo_Solicitud, Fecha_Solicitud, Notas } = data;
        
        const query = `
            INSERT INTO solicitudes_pago (idEstudiante, Tipo_Solicitud, Fecha_Solicitud, Notas)
            VALUES (?, ?, ?, ?)
        `;
        
        const [result] = await conn.promise().query(query, [
            idEstudiante,
            Tipo_Solicitud,
            Fecha_Solicitud,
            Notas || null
        ]);
        
        return result.insertId;
    }

    /**
     * Get all payment requests for a student
     * @param {number} idEstudiante
     * @returns {Promise<Array>} - Array of solicitudes
     */
    static async getSolicitudesByEstudiante(idEstudiante) {
        const query = `
            SELECT 
                idSolicitud,
                Tipo_Solicitud,
                Fecha_Solicitud,
                Notas,
                Fecha_Registro
            FROM solicitudes_pago
            WHERE idEstudiante = ?
            ORDER BY Fecha_Solicitud DESC, Fecha_Registro DESC
        `;
        
        const [rows] = await conn.promise().query(query, [idEstudiante]);
        return rows;
    }

    /**
     * Get the most recent payment request for a student
     * @param {number} idEstudiante
     * @returns {Promise<Object|null>} - Most recent solicitud or null
     */
    static async getUltimaSolicitud(idEstudiante) {
        const query = `
            SELECT 
                idSolicitud,
                Tipo_Solicitud,
                Fecha_Solicitud,
                Notas,
                Fecha_Registro
            FROM solicitudes_pago
            WHERE idEstudiante = ?
            ORDER BY Fecha_Solicitud DESC, Fecha_Registro DESC
            LIMIT 1
        `;
        
        const [rows] = await conn.promise().query(query, [idEstudiante]);
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Get payment request statistics for a student
     * @param {number} idEstudiante
     * @returns {Promise<Object>} - Statistics object
     */
    static async getEstadisticas(idEstudiante) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Tipo_Solicitud = 'WhatsApp' THEN 1 ELSE 0 END) as whatsapp,
                SUM(CASE WHEN Tipo_Solicitud = 'Email' THEN 1 ELSE 0 END) as email,
                SUM(CASE WHEN Tipo_Solicitud = 'Llamada' THEN 1 ELSE 0 END) as llamada,
                MAX(Fecha_Solicitud) as ultima_fecha
            FROM solicitudes_pago
            WHERE idEstudiante = ?
        `;
        
        const [rows] = await conn.promise().query(query, [idEstudiante]);
        return rows[0];
    }
}

module.exports = { SolicitudPago };
