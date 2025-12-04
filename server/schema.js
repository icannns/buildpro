const gql = require('graphql-tag');

const typeDefs = gql`
  type Project {
    id: ID!
    name: String
    progress: Int
    status: String
    end_date: String
    paymentTerms: [PaymentTerm]
  }

  type PaymentTerm {
    id: ID!
    termin_name: String
    amount: Float
    status: String
    due_date: String
    milestone_percentage: Float
  }

  type Material {
    id: ID!
    name: String
    stock: Int
    unit: String
    price: Float
  }

  type Query {
    projects: [Project]
    materials: [Material]
    project(id: ID!): Project
  }
`;

module.exports = typeDefs;
