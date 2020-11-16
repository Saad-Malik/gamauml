import { compareSync } from 'bcryptjs';
import { DomainConfiguration} from 'graph-on-rails';
import _, {isEmpty, isUndefined, nth } from 'lodash';
import { PlantUmlPipe } from "plantuml-pipe";
import * as fs from "fs";

export default class UMLDefinition {

  domainConfiguration: DomainConfiguration;
  private puml:PlantUmlPipe = new PlantUmlPipe();


  constructor(domainConfiguration: DomainConfiguration){
    this.domainConfiguration = domainConfiguration;
  }

  // Generate Enum Class for Plantuml
  generateEnum(){
    _.keys(this.domainConfiguration.enum).forEach((e,i)=>{
      console.log("enum " + e + " {");
      this.puml.in.write(`enum ${e} { \n`);
      const data:any =_.nth(_.values(this.domainConfiguration.enum), i)  
      data.forEach((element: any) => {
        console.log(element)
        this.puml.in.write(`${element} \n`);
      });
      console.log(" }");
      this.puml.in.write(' } \n');
    })
  }

  //generate class for PlantUML
  generateClass(){
    _.keys(this.domainConfiguration.entity).forEach((entity,i) => {
        console.log("class " + entity + " {")
        this.puml.in.write(`class ${entity} { \n`)

        const data:any = _.nth(_.values(this.domainConfiguration.entity), i);
        const dataType:any =_.mapValues(data?.attributes,'type');
          _.keysIn(dataType).forEach((k,i)=>{
            if(!isUndefined(dataType[k])){
              console.log(k + " : " + dataType[k]);
              this.puml.in.write(`${k} : ${dataType[k]} \n`)

            } else{
              console.log(k + " : " + data?.attributes[k]);
              this.puml.in.write(`${k} : ${data?.attributes[k]} \n`)
            }
          });
      
        console.log(" }")
        this.puml.in.write(`} \n`)

    });
  }

  // generate relationships for both (to and many) for plantUML
  geneateRelation(){
    _.keys(this.domainConfiguration.entity).forEach((entity,i) => {
        const data = _.nth(_.values(this.domainConfiguration.entity), i);
        this.generateRelationTo(entity,data?.assocTo);
        this.generateRelationToMany(entity,data?.assocToMany);
    });
  }


  private generateRelationTo(entity:string,relation:any){
    if(!isEmpty(relation)){
      for(const i in relation){
        if(!isUndefined(relation[i].type)){
          console.log(entity + " --> " + relation[i].type)
          this.puml.in.write(`${entity} --> ${relation[i].type} \n`)
        }else{
        console.log(entity + " --> " + relation[i])
        this.puml.in.write(`${entity} --> ${relation[i]} \n`)
      }
    } 
  }
  }

  private generateRelationToMany(entity: string,relation: any){
    if(!isEmpty(relation)){
      for(const i in relation){
        if(!isUndefined(relation[i].type)){
          console.log(entity + " *-- " + relation[i].type)
          this.puml.in.write(`${entity} *-- ${relation[i].type} \n`)
        }else{
        console.log(entity + " *-- " + relation[i])
        this.puml.in.write(`${entity} *-- ${relation[i]} \n`)

      } 
    }    
  }
  }

  // print out the end result - Currently console log 
  public generateUMLDescription(){
    console.log("@startuml")
    this.generateClass();
    this.generateEnum();
    this.geneateRelation();
    console.log("@enduml")
  }


  // draw an SVG diagram 
  generateUML(){

    this.puml.out.on("data", (chunk: string) => {
        fs.writeFileSync("./gama.svg", chunk);
    });

    this.puml.in.write("@startuml\n");
    this.generateEnum();
    this.generateClass();
    this.geneateRelation();
    this.puml.in.write("@enduml\n");
    this.puml.in.end();
  }



}