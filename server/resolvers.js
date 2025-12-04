const db = require('./db');

const resolvers = {
    Query: {
        projects: async () => {
            try {
                const [rows] = await db.execute('SELECT * FROM projects');
                return rows;
            } catch (error) {
                console.error('Error fetching projects:', error);
                throw new Error('Failed to fetch projects');
            }
        },
        materials: async () => {
            try {
                const [rows] = await db.execute('SELECT * FROM materials');
                return rows;
            } catch (error) {
                console.error('Error fetching materials:', error);
                throw new Error('Failed to fetch materials');
            }
        },
        project: async (_, { id }) => {
            try {
                const [rows] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
                return rows[0];
            } catch (error) {
                console.error('Error fetching project:', error);
                throw new Error('Failed to fetch project');
            }
        }
    },
    Project: {
        paymentTerms: async (parent) => {
            try {
                const [rows] = await db.execute('SELECT * FROM payment_terms WHERE project_id = ?', [parent.id]);
                return rows;
            } catch (error) {
                console.error('Error fetching payment terms:', error);
                return [];
            }
        }
    }
};

module.exports = resolvers;
