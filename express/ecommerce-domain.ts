import { DomainDefinition } from "graph-on-rails";

export const domainDefinition:DomainDefinition = new DomainDefinition({
    entity:{
        Product:{
            attributes:{
                name:'string!',
                price:{
                    type:'int',
                    validation:{
                        presence:true,
                    }
                },
            }
        },
        
        Image:{
           attributes:{
               url:'string'
           },
           assocToMany:'Product'     
        },

        Customer:{
           attributes:{
               name:'string!',
               email:{
                   type:'string',
                   validation:{
                        presence:true,
                        email:true     
                   }
               }
           },
        },

        Review:{
            attributes:{
                description:'string',
                star:{
                    type:'int',
                    validation:{
                        presence:true,
                        length:{
                            minimum:1
                        }
                    }                
                }
            },
            assocTo:['Customer','Product']
        }
    }

});