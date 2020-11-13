import { database } from 'faker';
import _, { isEmpty, List } from 'lodash';

export default class UMLDefinition{
   
  domainConfiguration: any;

  constructor(domainConfiguration: any){
      this.domainConfiguration = domainConfiguration;
  }

  // return an array of entities 
  getEntities(){
     return Object.keys(this.domainConfiguration.entity); 
  }

  
  getAttributesKey(){
    let entities = this.getEntities();
    let attributesKey: any[] = [];
    let obj = this.domainConfiguration.entity;
    entities.forEach((val,i)=>{
      attributesKey.push(Object.keys(obj[val].attributes))
    })
    return attributesKey;
  }

  getAttributesValues(){
    let entities = this.getEntities();
    let attributesValues: any[] = [];
    let obj = this.domainConfiguration.entity;
    entities.forEach((val,i)=>{
      attributesValues.push(Object.values(obj[val].attributes))
    })
    return attributesValues;
  }

  combine(){
    let keys = this.getAttributesKey();
    let value = this.getAttributesValues();
    let object = [];
    for (let i = 0; i < keys.length; i++){
         object.push(_.zipObject(keys[i],value[i]))
    }
    return object;
  }

  entityWithAttributes(){
    let entitis = this.getEntities();
    let attributes =this.combine();

    entitis.forEach((entity,i) => {
        console.log("class " + entity)
        console.log(_.nth(attributes, i))
        console.log()
    });
  }


  // convert into relation TODO: CATCH NULL
  assocToUML(){
    let entities = this.getEntities();
    let attributesValues: any[] = [];
    let obj = this.domainConfiguration.entity;
    entities.forEach((val,i)=>{
      if (typeof Object.getOwnPropertyNames(obj[val]) !== 'undefined' && Object.getOwnPropertyNames(obj[val]).length > 0) {
          attributesValues.push( Object.getOwnPropertyNames(obj[val]))
        }
    })
    console.log(attributesValues);
  }

  
  // save it in a file 


  // print out the end result
  public generateUML(){
    console.log("@startuml")
    this.entityWithAttributes();
    console.log("@enduml")
  }


}