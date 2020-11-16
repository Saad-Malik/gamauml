import { ApolloServerExpressConfig } from 'apollo-server-express';
import compression from 'compression';
import cors from 'cors';
//import { list1 } from './examples/attribute-configuration';
import {domainDefinition as ecommerce} from './ecommerce-domain';
import express from 'express';
import { GamaServer, DomainConfiguration, Runtime, DomainDefinition } from 'graph-on-rails';
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

const domainDefinition = new DomainDefinition({
    
  enum:{
    LikeModel:[
      'Like',
      'Dislike',
      'Happy',
      'Love',
      'Sad'
    ]
  },
  
  entity:{ 
    
    // User 
    User: {
      attributes:{
        name:{
          type:'string',
          required:true
        },
        email:{
          type:'key',
          validation:{
            email:true
          }
        }
      },
      assocFrom:['Friend','Status','Like'],
      seeds:{
        john:{name:"John",email:"john@net.com"},
        max:{name:"Max", email:"max@yahoo.com"}
      }
    },

    //status posted by a user
    Status: {
      attributes:{
        text:{
          type:'string',
          validation:{
            presence:true,
            length:{
              minimum:10
            }
          }
        },
      },
      assocTo: 'User',
      assocFrom: 'Like'
    },

    //a user can like any status
    Like: {
       attributes:{
        reaction:{
           type:'LikeModel',
        },
        // Can I check if the user is unique for every reaction on a status via only domain configuration!  
       },
       assocTo:'User',
       assocToMany:'Status'    
    },

    //a user can make multiple friends 
    // Can I create an Entity without any attribute? Forexample I only need an ID table.
    Friend: {
      attributes:{
        helper:'key'
      },
      assocToMany:'User'
    },

    Stat: {
      attributes:{
        count: 'int'
      },
      assocToMany:['Friend', 'Like'],
      assocTo: ['User','Status']
    }

  }
})

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


  
  const runtime = await Runtime.create(domainDefinition);
  const runtimeConfiguration = runtime.domainDefinition.getConfiguration();
  const uml = new UMLDefinition(runtimeConfiguration);
  uml.generateUML();
  
  const httpServer = createServer( app );

  app.get('/svg', function(req, res) {
    res.set('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(__dirname, './gama.svg'))
  });

  httpServer.listen(
    { port: 3000 },
    () => console.log(`
      🚀 GraphQL is now running on http://localhost:3000/graphql`)
  );

})();

