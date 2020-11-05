import { ApolloServerExpressConfig } from 'apollo-server-express';

import express from 'express';
import { DomainDefinition, Entity, DomainConfiguration, Runtime } from 'graph-on-rails';
import _ from 'lodash';

import { SimpleLogin } from './extras/simple-login';

const domainConfiguration1:DomainConfiguration = {
  enum: {
    CarBrand: ['Mercedes', 'BMW', 'Volkswagen', 'Audi', 'Porsche', 'Toyota', 'Bentley']
  },
  entity: {
    car: {
      attributes: {
        brand: 'CarBrand',
        mileage: 'int',
        color: 'string'
      }
    }
  },
  query: {
    leMansWinner: (rt:Runtime) => ({
      type: '[Int!]',
      args: { brand: { type: 'CarBrand' } },
      resolve: ( root:any, args:any ) => _.get( {
        Toyota: [2020, 2019, 2018], Porsche: [2017,2016,2015,2014,2013,2012,2011,2010], Peugeot: [2009], Audi: [2008,2007,2006,2005,2004], Bentley:[2003]
      }, args.brand as string )
    })
  },
  mutation: {
    repaint: (rt:Runtime) => ({
      type: 'Car',
      args: { id: { type: 'ID' }, color: { type: 'String!' } },
      resolve: async (root:any, args:any) => {
        const car = rt.entities['Car'];
        const c = await car.findById( args.id );
        if( ! c ) throw new Error(`no car with id '${args.id}'`);
        c.item.color = args.color;
        await c.save();
        return _.merge( {}, c.item ); // strange, very very strange
      }
    })
  }
}


const domainConfiguration:DomainConfiguration = {
  enum: {
    CarModel: [
      'Mercedes',
      'Volkswagen',
      'BMW'
    ]
  },
  entity: {
    Car: {
      typeName: 'Vehicle',
      attributes: {
        model: 'CarModel!',
        color: {
          type: 'string',
          validation: {
            presence: true,
            length: {
              minimum: 2
            }
          }
        },
        licence: 'string',
        mileage: 'int'
      },
      seeds: {
        black_bmw: { model: 'BMW', color: 'black' }
      }
    },
    Driver: {
      attributes: {
        firstname: 'string!',
        lastname: 'string',
      },
      assocFrom: ['Department'],
      seeds: {
        Faker: {
          count: 100,
          firstname: 'faker.name.firstName',
          lastname: 'faker.name.lastName'
        },
        max: { firstname: 'Max', lastname: 'Mayer' },
        saad: { firstname: 'Saad'}
      }
    },
    Department: {
      attributes: {
        name: {
          type: 'string',
          required: true,
          unique: 'Company'
        }
      },
      assocToMany: 'Driver',
      assocTo: 'Company!',
      seeds: {
        Faker: {
          count: 30,
          name: 'faker.commerce.department',

        },
        hr_disphere: { Company: 'disphere', Driver: ['max', 'saad'], name: 'hr' },
        hr_ms: { Company: 'ms', Driver: ['saad'], name: 'hr' },
      }
    },
    Company: {
      attributes: {
        name: 'key'
      },
      assocFrom: 'Department',
      seeds: {
        Faker: {
          count: 10,
          name: 'faker.company.companyName'
        },
        disphere: { name: 'Disphere' },
        ms: { name: 'Microsoft' }
      }
    }
  }
};

export const domainDefinition = new DomainDefinition( domainConfiguration1 );
















































export const login = ( config:ApolloServerExpressConfig ):DomainDefinition => {
  const domainDefinition = new DomainDefinition( `${__dirname}/config-types/d2prom` );
  SimpleLogin.addToDefinition( domainDefinition, config );
  return domainDefinition;
}







































export const doc = () => {
  return `${__dirname}/config-types/doc`;
}






export const d2prom = ():DomainDefinition => {

  const domainDefinition = new DomainDefinition( `${__dirname}/config-types/d2prom` );

  const login = new SimpleLogin();
  domainDefinition.add( login.getConfiguration() );
  const context = (contextExpress:{req:express.Request }) => {
    const token:string|undefined = contextExpress.req.headers.authorization;
    return { user: login.getUser(token) };
  }

  domainDefinition.add({
    entity: {
      RiskAssessment: {
        attributes: {
          priority: {
            type: 'Priority',
            calculate: ( root:any ) => {
              const probability = _.get( root, 'probability');
              const damage = _.get( root, 'damage');
              const result = probability * damage;
              if( result <= 3 ) return 10;
              if( result <= 8 ) return 20;
              return 30;
            }
          }
        }
      },
      ProcessingActivity: {
        seeds: {
          Faker: {
            Organisation: async (evalContext:any) => {
              const entity:Entity = evalContext.context.entities['Organisation'];
              const items = await entity.findByAttribute({});
              const id = _.sample( items )?.id;
              _.set(evalContext.seed, 'organisationId', id );
              return id;
            },
            OrganisationalUnit: async (evalContext:any) => {
              const entity:Entity = evalContext.context.entities['OrganisationalUnit'];
              const items = await entity.findByAttribute( {organisationId: evalContext.seed.organisationId } );
              const ids = _.map( items, item => item.id );
              return _.sampleSize( ids, _.random( 1, 3) );
            }
          }
        }
      }
    }
  });

  return domainDefinition;
}
