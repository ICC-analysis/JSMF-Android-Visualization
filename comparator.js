'use strict'
var jsmf = require('jsmf-core'),
    Class = jsmf.Class, Model = jsmf.Model;

var _ =require('lodash');

//Compare models with same/similar (i.e., with same name, not necessarily full similar signature) metamodels 
function compare(ModelSource,ModelTarget) {
    
    //Compute values
    //console.log(ModelSource);
    
    const mSourceElements = ModelSource.modellingElements;
    const mTargetElements = ModelTarget.modellingElements;
    
    var mSourceMetrics = new Map();
    var mTargetMetrics = new Map();
    
    var keys = [];
    
    var sameSimilar = [];
    
    //comparison class by class
    _.each(mSourceElements,function(elements,id){
        //assuming they have the same classes
        console.log(id);
        mSourceMetrics.set(id,elements.length);
        _.each(elements,function(elem){
         //  var currentlnormal = normalizeModelElements(elem);
            _.each(mTargetElements[id], function(target) {
                
                //Assumption: Objects have the same metamodel... should be tested before
                var diff = modelElementDifference(elem,target,1);
                const diflen= diff.length;
               
                if(diflen!==0) {
                    //console.log('diff ',elem.name, ' : ', target.name, '/ ', diff);
                    //compute too "much" difference (heuristic) -> see with bayesian approach
                    var attributeKeys = Object.keys(elem.conformsTo().getAllAttributes());
                  
                        // if some attributes are common =>threshold 50%?
                        if(diflen<=(attributeKeys.length/2)) {
                        console.log('Similar');
                        sameSimilar.push({type:'diff',src:elem,tgt:target,meta:id,diff:diff});
                        } else {
                            //if all attributes are different => different modelling elements
                            console.log('too much difference: probably not the same elements');
                        }
                    
                } else {
                    console.log('Same Objects');
                    sameSimilar.push({type:'same',src: elem, tgt: target, meta:id,diff:[]});
                    //Similar checked : add tuple source/target to list as similar
                }
            });
           
        });
     }); 
    
    
    _.each(mTargetElements,function(elements,id){
        mTargetMetrics.set(id,elements.length);
    });
   
    return ({"sourceMetrics": mSourceMetrics,"targetMetrics":mTargetMetrics});
}

function buildExample() {
    var m1 = new Model('source');
    var m2 = new Model('target');
    
    var MM = Class.newInstance('MM');
    MM.setAttribute('name',String);
    MM.setAttribute('permission',Boolean);
    
    var MMbis = Class.newInstance('MMbis');
    MMbis.setAttribute('name',String);
    MMbis.setAttribute('inv',Number);
    
    MM.setReference('refMb', MMbis, -1);
    
    //Model 1
    var ms = MM.newInstance();
    ms.name='sourceEl'
    ms.permission=false;
    
    
    var mrav = MM.newInstance();
    mrav.name='sourceRAV';
    mrav.permission=false;
    
    var bis = MMbis.newInstance();
    bis.name='bis';
    bis.inv=12;
    
    ms.refMb=bis;
    
    // Model   2 compared
    var mt1 = MM.newInstance();
    mt1.name='targetEL'
    mt1.permission=false;
    
    var mt2= MM.newInstance();
    mt2.name='sourceEl';
    mt2.permission=false; //  // console.log( _.difference(attributeKeys,targetKeys))console.log( _.difference(attributeKeys,targetKeys))
    
    var mt3=MM.newInstance();
    mt3.name='sourceEl';
    mt3.permission=true;
    
    var b1 = MMbis.newInstance();
    b1.name='bis';
    b1.inv=12;
    
    mt2.refMb=b1;
    
    m1.setModellingElements([ms,mrav,bis]);
    m2.setModellingElements([mt1,mt2,mt3,b1]);
    
    return {sm: m1, tm:m2};
    
}

/**
* Pairwise comparison of two model elements conforms to the same metamodel element.
@pre-condition: the two elements have common metamodel
@return an object containing the difference (can/should be a JSMF model!). Undefined  if any of source or target are undefined
*/
function modelElementDifference(source,target,depth) {
    
    //init the depth to one = checking references
    var depth = depth==undefined? 1 : depth;
    
    if(target!==undefined && source!==undefined) {
        var diffObject = [];
        //precond : source / target !== undefined
        var attributeKeys = Object.keys(source.conformsTo().getAllAttributes());
        //var targetKeys = Object.keys(source.conformsTo().getAllAttributes());

        //do the same for references
        var referenceKeys = Object.keys(source.conformsTo().getAllReferences());
        //var referenceTargetKeys = Object.keys(source.conformsTo().getAllReferences());

        _.each(attributeKeys,function(attName){
            //console.log(attName, " : ",source[attName], "vs", target[attName]);
            if(!(_.isEqual(source[attName],target[attName]))){
                diffObject.push({name:attName,targetValue:target[attName],sourceValue:source[attName]});
            }

        });
        //do not go to deep in the object comparisons
        if(depth>0) {
            _.each(referenceKeys, function(refName) {
              if(source[refName].length!=0) {

                //TODO: check the targetted types
                  
                   //not the same "actual" cardinality
                    if(!(source[refName].length==target[refName].length)) {
                    //TODO : there are maybesame similar targetted elements...
                            console.log('unsupported situation yet... but critical', target[refName].length);
                    } else {
                    //check the elements targetted  
                            console.log('found one');
                     var diffTargets = [];
                        for(var ind=0;ind < source[refName].length; ind++){
                           var srcElement = source[refName][ind];
                           var tgtElement = target[refName][ind];
                            //reducing the depth by one (i.e., getting down the relationship stream)
                                // todo: try to stop before cycle...
                            var diffRef= modelElementDifference(srcElement,tgtElement,depth-1);
                            console.log(diffRef.length,diffRef);
                            if(diffRef.length!=0 || diffRef==undefined) {
                              diffTargets.push({src:srcElement,tgt:tgtElement})
                            } else {console.log("verySame")}
                        } //endFor traversal of relationships pointers
                     diffObject.push({name:refName, diffCouples:diffTargets});
                    }   
              } //endif : if source[refName] is defined
            });
        }
    }
    return diffObject;
}


var comparator = buildExample();
compare(comparator.sm, comparator.tm);


module.exports = {
    compare: compare
} 