const { tiposarchivos } = require('../models');
let self = {}

self.getAll = async function(req, res) {
    try {
        const [data, metadata] = await sequelize.query('SELECT * FROM vw_get_all_tiposarchivos');

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = self;