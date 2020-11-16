import { DomainConfiguration} from 'graph-on-rails';
import _, {isEmpty, isUndefined } from 'lodash';

export default class UMLDefinition {

  domainConfiguration: DomainConfiguration;

  constructor(domainConfiguration: DomainConfiguration){
    this.domainConfiguration = domainConfiguration;
  }

  // return an array of entities 
  getEntities(){
     return _.keys(this.domainConfiguration.entity);
  }


  // return attributes of an entities
  getAttributes(){
     return _.values(this.domainConfiguration.entity);
  }

  displayClass(){
    let entitis = this.getEntities();
    let attributes =this.getAttributes();
    entitis.forEach((entity,i) => {
        console.log("class " + entity)
        const data = _.nth(attributes, i);
        console.log(data?.attributes);
    });
  }

  displayRelation(){
    let entitis = this.getEntities();
    let attributes =this.getAttributes();
    entitis.forEach((entity,i) => {
        const data = _.nth(attributes, i);
        this.generateRelationTo(entity,data?.assocTo);
        this.generateRelationToMany(entity,data?.assocToMany);
    });
  }


  private generateRelationTo(entity:string,relation:any){
    if(!isEmpty(relation)){
      for(const i in relation){
        if(!isUndefined(relation[i].type)){
          console.log(entity + " --> " + relation[i].type)
        }else{
        console.log(entity + " --> " + relation[i])
      }
    } 
  }
  }

  private generateRelationToMany(entity: string,relation: any){
    if(!isEmpty(relation)){
      for(const i in relation){
        if(!isUndefined(relation[i].type)){
          console.log(entity + " *-- " + relation[i].type)
        }else{
        console.log(entity + " *-- " + relation[i])
      } 
    }    
  }
  }

  // print out the end result - Currently console log 
  public generateUML(){
    console.log("@startuml")
    this.displayClass();
    this.displayRelation();
    console.log("@enduml")
  }


}