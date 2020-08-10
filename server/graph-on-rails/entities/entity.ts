import inflection from 'inflection';
import _ from 'lodash';

import { Context } from '../core/context';
import { ResolverContext } from '../core/resolver-context';
import { EntityAccessor } from './entity-accessor';
import { EntityItem } from './entity-item';
import { CrudAction, EntityPermissions, EntityPermissionType } from './entity-permissions';
import { EntityResolver } from './entity-resolver';
import { EntitySeeder } from './entity-seeder';
import { EntityValidator, ValidationViolation } from './entity-validator';
import { TypeAttribute } from './type-attribute';
import { EntityFileSave } from './entity-file-save';

export type AssocType = {
  type:string
}

export type AssocFromType = AssocType & {
  delete?:'prevent'|'nullify'|'cascade'
}

export type AssocToType = AssocType & {
  required?:boolean
  delete?:'silent'|'cascade'
  input?:boolean
}

export type AssocToManyType = AssocToType & {
  scope?:string
}


//
//
export abstract class Entity {

  private _context!:Context;
  get context() { return this._context }
  get graphx() { return this.context.graphx }
  get entityPermissions() { return this._entityPermissions }
  get seeder() { return this._entitySeeder }
  get resolver() { return this._entityResolver }
  get validator() { return this._entityValidator }
  get accessor() { return this._entityAccessor }
  get fileSave() { return this._entityFileSave }

  protected _entitySeeder!:EntitySeeder;
  protected _entityResolver!:EntityResolver;
  protected _entityPermissions!:EntityPermissions;
  protected _entityValidator!:EntityValidator;
  protected _entityAccessor!:EntityAccessor;
  protected _entityFileSave!:EntityFileSave;


  /**
   *
   */
  init( context:Context ){
    this._context = context;
    this.context.entities[this.typeName] = this;
    this._entityResolver = this.context.entityResolver( this );
    this._entitySeeder = this.context.entitySeeder( this );
    this._entityPermissions = this.context.entityPermissions( this );
    this._entityFileSave = this.context.entityFileSave( this );
    this._entityValidator = new EntityValidator( this );
    this._entityAccessor = new EntityAccessor( this );
  }

  get name() { return this.getName() }
  get typeName(){ return this.getTypeName() }
  get attributes() { return this.getAttributes() }
  get assocTo() { return this.getAssocTo() }
  get assocToInput() { return _.filter( this.getAssocTo(), assocTo => assocTo.input === true ) }
  get assocToMany() { return this.getAssocToMany() }
  get assocFrom() { return this.getAssocFrom() }
  get singular() { return this.getSingular() }
  get plural() { return this.getPlural() }
  get foreignKey() { return this.getForeignKey() }
  get foreignKeys() { return this.getForeignKeys() }
  get createInput() { return this.getCreateInput() }
  get updateInput() { return this.getUpdateInput() }
  get filterName() { return this.getFilterName() }
  get sorterEnumName() { return this.getSorterEnumName() }
  get collection() { return this.getCollection() }
  get enum() { return this.getEnum() }
  get seeds() { return this.getSeeds() }
  get permissions() { return this.getPermissions() }
  get equality() { return this.getEquality() }
  get description() { return this.getDescription() }
  get entities() { return this.getEntites() }
  get typeField() { return this.getTypeField() }
  get typesEnumName() { return this.getTypeEnumName() }
  get isInterface():boolean { return this.getIsInterface() }
  get isUnion():boolean { return  ! this.isInterface && ! _.isEmpty( this.entities ) }
  get isPolymorph():boolean { return this.isUnion || this.isInterface }
  get implements():Entity[] { return _.filter( this.getImplements(), entity => entity.isInterface ) }
  get deleteMutation():string { return this.getDeleteMutation() }
  get createMutation():string { return this.getCreateMutation() }
  get updateMutation():string { return this.getUpdateMutation() }
  get mutationResultName():string { return this.getMutationResultName() }
  get typesQuery():string { return this.getTypesQuery() }
  get typeQuery():string { return this.getTypeQuery() }
  get path() { return this.getPath() }

  protected abstract getName():string;
  protected getTypeName() { return inflection.camelize( this.name ) }
  protected getSingular() { return `${_.toLower(this.typeName.substring(0,1))}${this.typeName.substring(1)}` }
  protected getPlural() { return inflection.pluralize( this.singular ) }
  protected getForeignKey() { return `${this.singular}Id` }
  protected getForeignKeys() { return `${this.singular}Ids` }
  protected getCreateInput() { return `${this.typeName}CreateInput` }
  protected getUpdateInput() { return `${this.typeName}UpdateInput` }
  protected getFilterName() { return `${this.typeName}Filter` }
  protected getSorterEnumName() { return `${this.typeName}Sort` }
  protected getCollection() { return this.plural }
  protected getAttributes():{[name:string]:TypeAttribute} { return {} };
  protected getAssocTo():AssocToType[] { return [] }
  protected getAssocToMany():AssocToManyType[] { return [] }
  protected getAssocFrom():AssocFromType[] { return [] }
  protected getEnum():{[name:string]:{[key:string]:string}} { return {} }
  protected getSeeds():{[name:string]:any} { return {} }
  protected getPermissions():undefined|EntityPermissionType { return undefined }
  protected getEquality():{[typeName:string]:string[]} {return {}}
  protected getDescription():string|undefined { return }
  protected getEntites():Entity[] { return [] }
  protected getIsInterface():boolean { return false }
  protected getImplements():Entity[] { return [] }
  protected getTypeField():string { return `${this.singular}Type` }
  protected getTypeEnumName():string { return `${this.typeName}Types` }
  protected getCreateMutation():string { return `create${this.typeName}` }
  protected getUpdateMutation():string { return `update${this.typeName}` }
  protected getMutationResultName():string { return `Save${this.typeName}MutationResult` }
  protected getTypesQuery():string { return this.plural }
  protected getTypeQuery():string { return this.singular }
  protected getDeleteMutation():string { return `delete${this.typeName}` }
  protected getPath() { return inflection.underscore( this.plural ) }

  /**
   *
   */
  getAttribute(name:string):TypeAttribute|undefined {
    const attribute = this.attributes[name];
    if( attribute ) return attribute;
    const implAttributes = _.map( this.implements, impl => impl.getAttribute( name ) );
    return _.first( _.compact( implAttributes ) );
  }

  /**
   *
   */
  isAssoc( name:string ):boolean {
    if( _.find( this.assocTo, assocTo => assocTo.type === name ) ) return true;
    if( _.find( this.assocToMany, assocTo => assocTo.type === name ) ) return true;
    if( _.find( this.assocFrom, assocTo => assocTo.type === name ) ) return true;
    return false;
  }

  /**
   *
   */
  isAssocToAttribute( attribute:string ):boolean {
    return _.find( this.assocTo, assocTo => {
      const ref = this.context.entities[assocTo.type];
      return ref && ref.foreignKey === attribute;
    }) != null;
  }

  /**
   *
   */
  isAssocToMany( ref:Entity ):boolean {
    return _.find( this.assocToMany, assocToMany => assocToMany.type === ref.typeName ) != undefined;
  }

  /**
   *
   */
  isFileAttribute( attribute:TypeAttribute ):boolean {
    const name = _.isString( attribute.graphqlType ) ?
      attribute.graphqlType : _.get( attribute.graphqlType, 'name' );
    return name === 'file';
  }


  /**
   *
   */
  async getPermittedIds( action:CrudAction, resolverCtx:ResolverContext ):Promise<boolean|number[]> {
    if( ! this.entityPermissions ) throw new Error( 'no EntityPermission provider' );
    return this.entityPermissions.getPermittedIds( action, resolverCtx );
  }

  /**
   *
   */
  async validate( attributes:any ):Promise<ValidationViolation[]> {
    return this.validator.validate( attributes );
  }

  /**
   * @returns true if the given entity is an interface and this entity implements it
   */
  implementsEntityInterface( entity:Entity):boolean {
    if( ! entity.isInterface ) return false;
    return _.includes( this.implements, entity );
  }

  /**
   *
   */
  async findById( id:any ):Promise<EntityItem> {
    return this.accessor.findById( id );
  }

  /**
   *
   */
  async findByIds( ids:any[] ):Promise<EntityItem[]> {
    return this.accessor.findByIds( ids );
  }

  /**
   *
   */
  async findByAttribute( attrValue:{[name:string]:any} ):Promise<EntityItem[]> {
    return this.accessor.findByAttribute( attrValue );
  }

  /**
   *
   */
  async findOneByAttribute( attrValue:{[name:string]:any} ):Promise<EntityItem|undefined> {
    return _.first( await this.accessor.findByAttribute( attrValue ) );
  }

}
