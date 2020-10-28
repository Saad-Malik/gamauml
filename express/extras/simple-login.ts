import { ApolloServerExpressConfig } from 'apollo-server-express';
import bcrypt from 'bcryptjs';
import express from 'express';
import { DomainConfiguration, DomainDefinition, Runtime } from 'graph-on-rails';
import { GraphQLNonNull, GraphQLString } from 'graphql';
import _ from 'lodash';

//
//
export class SimpleLogin {

  private users:any = {};

  static addToDefinition( domainDefinition:DomainDefinition, config:ApolloServerExpressConfig ):void {
    const login = new SimpleLogin();
    domainDefinition.add( login.getConfiguration() );
    config.context = (context:{req:express.Request }) => {
      const token:string|undefined = context.req.headers.authorization;
      return { user: login.getUser(token) };
    }
  }

  getConfiguration = ():DomainConfiguration => ({
    entity: {
      User: {
        attributes: {
          username: { type: 'string!' },
          password: { type: 'string!' },
        },
        seeds: {
          admin: {
            username: 'admin',
            password: this.password('admin')
          },
          user1: {
            username: 'user1',
            password: this.password('user1')
          },
          user2: {
            username: 'user2',
            password: this.password('user2')
          },
          user3: {
            username: 'user3',
            password: this.password('user3')
          }
        }
      }
    },
    mutation: {
      login: ( runtime:Runtime ) => ({
        type: GraphQLString,
        args: {
          username: { type: GraphQLNonNull( GraphQLString ) },
          password: { type: GraphQLNonNull( GraphQLString ) }
        },
        resolve: (root:any, args:any) => this.login( runtime, args.username, args.password )
      })
    }
  });

  getUser = (token?:string) => token ? this.users[token] : undefined;

  private login = async (runtime:Runtime, username:string, password:string):Promise<string|undefined> => {
    const entity = runtime.entities['User'];
    if( ! entity ) return runtime.warn( `no 'User' type found`, undefined );
    const user = await entity.findOneByAttribute( { username } );
    if( ! user ) return undefined;
    if( ! await bcrypt.compare( password, user.item.password ) ) return undefined;
    const token = this.password( _.toString(_.random(99999999999)) );
    this.setUser( token, user.item );
    return token;
  }

  private setUser = (token:string, user:any):void => {
    const key = _.findKey( this.users, value => value.id === user.id );
    if( key ) _.unset( this.users, key );
    _.set( this.users, token, user );
  }

  private password = (password:string):string => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync( password, salt);
    return hash;
  }
}