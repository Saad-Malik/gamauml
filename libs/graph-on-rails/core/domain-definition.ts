import fs from 'fs';
import { Entity } from '../entities/entity';
import _ from 'lodash';
import path from 'path';
import YAML from 'yaml';

import { EnumBuilder, EnumConfig } from '../builder/enum-builder';
import { MutationConfig } from '../builder/mutation-builder';
import { QueryConfig } from '../builder/query-builder';
import { EntityConfig } from '../entities/config-entity';
import { Runtime } from './runtime';


export type DomainConfiguration = {
  entity?:{[name:string]:EntityConfig},
  enum?:{[name:string]:EnumConfig},
  query?:{[name:string]:QueryConfig},
  mutation?:{[name:string]:MutationConfig}
}

export class DomainDefinition {

  extendSchema?:(runtime:Runtime) => void
  readonly entities:Entity[] = [];
  readonly enums:EnumBuilder[] = [];
  private configuration:DomainConfiguration;

  constructor( configOrconfigFolder?:DomainConfiguration|string|string[] ){
    this.configuration = _.isUndefined( configOrconfigFolder ) ? {} :
      _.isString( configOrconfigFolder ) || _.isArray( configOrconfigFolder) ?
        new FileConfiguration( configOrconfigFolder ).getConfiguration() :
        configOrconfigFolder;
  }

  add( configuration:DomainConfiguration ):void {
    _.merge( this.configuration, configuration );
  }

  getConfiguration():DomainConfiguration {
    return this.configuration;
  }
}

class FileConfiguration {

  constructor( private configFolder?:string|string[] ){
    if( _.isString( configFolder) ) this.configFolder = [configFolder];
  }

  /**
   *
   */
  getConfiguration():DomainConfiguration {
    const configuration:DomainConfiguration = {};
    _.forEach( this.configFolder, folder => {
      const files = this.getConfigFiles( folder );
      _.forEach( files, file => _.merge( configuration, this.parseConfigFile( configuration, folder, file ) ) );
    });
    return configuration;
  }

  /**
   *
   */
  private getConfigFiles( folder:string ):string[] {
    try {
      return _.filter( fs.readdirSync( folder ), file => this.isConfigFile(file) );
    } catch (error) {
      console.error( `cannot read files from folder '${folder}'`, error );
      return [];
    }
  }

  /**
   *
   */
  private isConfigFile( file:string ):boolean {
    const extension = _.toLower( path.extname( file ));
    return _.includes( ['.yaml', '.yml'], extension );
  }

  /**
   *
   */
  private parseConfigFile( configs:any, folder:string, file:string ):any {
    try {
      file = path.join( folder, file );
      const content = fs.readFileSync( file).toString();
      const config = YAML.parse(content);
      return config;
    } catch ( error ){
      console.warn( `Error parsing file [${file}]:`, error );
    }
  }

}