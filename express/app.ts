import { ApolloServerExpressConfig } from 'apollo-server-express';
import compression from 'compression';
import cors from 'cors';
//import { list1 } from './examples/attribute-configuration';
import {domainDefinition as ecommerce} from './ecommerce-domain';
import express from 'express';
import { GamaServer, DomainConfiguration, Runtime } from 'graph-on-rails';
import depthLimit from 'graphql-depth-limit';
import { createServer } from 'http';
import path from 'path';
import UMLDefinition  from './umlDefinition';

const example3:DomainConfiguration = {
  entity:{
    Car: {
      attributes: {
        brand: 'string!',
        mileage: 'int'
      }
  }
  }
};

const domainConfiguration= './config-types/car-config-1';


(async () => {
  const app = express();
  app.use('*', cors());
  app.use(compression());

  // const uploadRootDir = path.join(__dirname, 'uploads');
  // app.use('/uploads', express.static(uploadRootDir));

  // const apolloConfig:ApolloServerExpressConfig = { validationRules: [depthLimit(7)] };

  // const server = await GamaServer.create( apolloConfig, ecommerce);
  // server.applyMiddleware({ app, path: '/graphql' });

  const runtime = await Runtime.create(domainConfiguration);
  const runtimeConfiguration = runtime.domainDefinition.getConfiguration();
  const uml = new UMLDefinition(runtimeConfiguration);
  uml.generateUML();
  
  const httpServer = createServer( app );
  httpServer.listen(
    { port: 3000 },
    () => console.log(`
      🚀 GraphQL is now running on http://localhost:3000/graphql`)
  );

})();

