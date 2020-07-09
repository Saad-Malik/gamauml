import * as _ from 'lodash';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminData } from '../lib/admin-data';
import { AdminService } from './admin.service';
import { EntityConfigType, UiConfigType, FieldConfigType, AssocConfigType } from '../lib/admin-config';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { IndexComponent } from '../components/admin/index/index.component';
import { ShowComponent } from '../components/admin/show/show.component';
import { EditComponent } from '../components/admin/edit/edit.component';
import { CreateComponent } from '../components/admin/create/create.component';
import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class AdminDataResolver implements Resolve<AdminData> {

  constructor(
    private adminService:AdminService,
    protected apollo:Apollo
    ) {}

  resolve(route:ActivatedRouteSnapshot, state:RouterStateSnapshot):Promise<AdminData> {
    return new Promise( async resolve => {
      const id = route.params['id'];
      const path = route.params['path'];
      const parentPath = route.params['parent'];
      const parentId = route.params['parentId'];

      const parent = await this.getParentData( parentPath, parentId );
      const entityConfig = this.adminService.getEntityConfig(path);
      const load =
        route.component === IndexComponent ? this.loadItemsData( entityConfig, entityConfig.index, parent ) :
        route.component === ShowComponent ? this.loadItemData( entityConfig, entityConfig.show, id, parent ) :
        route.component === EditComponent ? this.loadItemData( entityConfig, entityConfig.form, id, parent ) :
        route.component === CreateComponent ? async () => ({}) :
        undefined;
      const adminData = await load;
      resolve( adminData );
    });
  }

  private async getParentData( path:string, id:string ):Promise<AdminData> {
    if( ! path ) return undefined;
    const config = this.adminService.getEntityConfig(path);
    if( ! config ) return this.warn( `no such config '${path}'`, undefined );
    return this.loadItemData( config, config.show, id );
  }

  private async loadItemsData( entityConfig:EntityConfigType, uiConfig:UiConfigType, parent?:AdminData ):Promise<AdminData> {
    const parentCondition = '' // this.getParentCondition();
    const expression = `query{ ${uiConfig.query}${parentCondition} ${ this.buildFieldQuery( entityConfig, uiConfig ) } }`;
    const query = { query: gql(expression), fetchPolicy: 'network-only' };
    const data = await this.loadData( query );
    return new AdminData( data, entityConfig, uiConfig, parent );
  }

  private async loadItemData(
      entityConfig:EntityConfigType,
      uiConfig:UiConfigType,
      id:string,
      parent?:AdminData ):Promise<any> {
    const expressions = [this.getItemLoadExpression( entityConfig, uiConfig )];
    expressions.push( ...
      _.compact( _.map( uiConfig.data, data => this.getDataLoadExpression( data, uiConfig ) ) ) );
    const expression = `query EntityQuery($id: ID!){ ${ _.join(expressions, '\n') } }`;
    const query = { query: gql(expression), variables: {id}, fetchPolicy: 'network-only' };
    const data = await this.loadData( query );
    return new AdminData( data, entityConfig, uiConfig, parent );
  }

  private getItemLoadExpression( entityConfig:EntityConfigType, uiConfig:UiConfigType ) {
    const fields = this.buildFieldQuery( entityConfig, uiConfig );
    return `${uiConfig.query}(id: $id) ${fields}`;
  }


  private getDataLoadExpression( data:AssocConfigType, uiConfig:UiConfigType ):string {
    if( _.isString( data ) ) data = { path: data };
    const config = this.adminService.getEntityConfig( data.path );
    if( ! config ) return this.warn(`no such config '${data.path}'`, undefined );
    const fields = this.buildFieldQuery( config, config.show );
    return `${config.typesQuery} ${fields}`;
  }


  protected async loadData( query:any ):Promise<any>{
    if( ! query ) return undefined;
    return new Promise( resolve => {
      this.apollo.watchQuery<any>( query )
      .valueChanges
      .subscribe(({ data, loading }) => {
        if( loading ) return;
        resolve( data );
      }, error => console.error( error ) );
    });
  }

  protected buildFieldQuery( entityConfig:EntityConfigType, uiConfig:UiConfigType ):string {
    const queryFields = _.intersection(
      _.keys(entityConfig.fields),
      _.map(uiConfig.fields, (field:FieldConfigType) => field.name ));
    const assocs = _.compact( _.uniq( _.concat(
      uiConfig.assoc, _.map( uiConfig.fields, (field:FieldConfigType) => field.path ) ) ) );
    const assocFields = _.map( assocs, assoc =>
        this.getAssocFields( entityConfig, assoc)).join( ' ');
    return `{ id ${ _.join( _.concat( queryFields, assocFields ), ' ' ) } }`;
  }

  protected getAssocFields( entityConfig:EntityConfigType, assoc:AssocConfigType ):string|undefined {
    if( _.isString( assoc ) ) assoc = _.set( {}, 'path', assoc );
    const config = this.adminService.getEntityConfig( assoc.path );
    if( ! config ) return this.warn( `getAssocFields: no config for path '${assoc.path}' `, undefined);
    const query = _.get( entityConfig.assocs, [assoc.path, 'query']);
    if( ! query ) return this.warn( `getAssocFields: no query for path '${assoc.path}' `, undefined);
    if( ! assoc.fields ) assoc.fields = _.keys( config.fields );
    const fields = _.filter( assoc.fields, field => _.includes( _.keys( config.fields ), field ) );
    return _.concat(
      query, '{ id ', fields, _.map( assoc.assoc, assoc => this.getAssocFields( config, assoc ) ), '}'
    ).join( ' ' );
  }


  // protected getParentCondition():string {
  //   const config = this.adminService.getEntityConfig( this.parent.path );
  //   if( ! config ) return this.warn(`no such config '${this.parent.path}'`, '');
  //   return `(filter: {${config.foreignKey}: "${this.parent.id}"})`;
  // }


  protected warn<T>( message:string, type:T ):T {
    console.warn(message);
    return type;
  }

}
