const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { json } = require('body-parser');
const cors = require('cors');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {
    const app = express();
    const PORT = process.env.PORT || 5006;

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(server),
    );

    // REST API Placeholder (to satisfy "JANGAN DIHAPUS" requirement)
    app.get('/', (req, res) => {
        res.json({ status: 'Active', message: 'GraphQL Server is running at /graphql' });
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
}

startServer();
