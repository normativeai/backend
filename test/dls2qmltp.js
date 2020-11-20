var assert = require('assert')
const fs = require('fs');
const chai = require('chai');
const { expect } = chai;

var converter = require('../models/dls2qmltp')

const pairs = [
  ['((earlier(X,Y),earlier(Y,Z)) => earlier(X,Z))','qmf(axiom_0,axiom,(! X__var: ! Y__var: ! Z__var: ((earlier(X__var,Y__var) & earlier(Y__var,Z__var)) => earlier(X__var,Z__var)))).'],
  ['(((((((((((~ already_has(Subject, contact_details(Controller))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time0, contact_details(Controller))) , ((((~ already_has(Subject, contact_details(Representive))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , representive(Controller, Representive)) O> communicate_at_time(Controller, Subject, Time0, contact_details(Representive)))) , ((((~ already_has(Subject, contact_details(DPO))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , data_protection_officer(DPO,Data)) O> communicate_at_time(Controller, Subject, Time0, contact_details(DPO)))) , (((~ already_has(Subject, purpose_of_processing(Purpose, Data))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time0, purpose_of_processing(Purpose, Data)))) , (((~ already_has(Subject, legal_basis(LegalBasis, Purpose))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) O> communicate_at_time(Controller, Subject, Time0, legal_basis(LegalBasis, Purpose)))) , ((((~ already_has(Subject, legitimate_interest_third_party_or(Party,Controller))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , justification_based(Justification, article_6_1)) O> communicate_at_time(Controller, Subject, Time0, legitimate_interest_third_party_or(Party,Controller)))) , ((((~ already_has(Subject, recepients_of_data(Recipients))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , recipients_personal_data(Recipients, Data)) O> communicate_at_time(Controller, Subject, Time0, recepients_of_data(Recipients)))) , ((((~ already_has(Subject, information_of_transfer(Controller, Data, Country, Information))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , intent_transfer_data_to(Controller, Data, Country)) O> communicate_at_time(Controller, Subject, Time0, information_of_transfer(Controller, Data, Country, Information)))) , ((((~ already_has(Subject, appropriate_safeguards(Controller, Data, Country, SafeGuards))) , ((((((processor(Processor) , nominate(Controller, Processor)) , personal_data_processed(Processor, Data, Time, Justification, Purpose)) , personal_data(Data,Subject)) , collected_at(Data,Time0)) , data_subject(Subject)) , controller(Controller, Data))) , transfer_relates_to(Controller, Data, Country, article_46_47_p2_article_49_1)) O> communicate_at_time(Controller, Subject, Time0, appropriate_safeguards(Controller, Data, Country, SafeGuards))))', '']
];

describe("DL*2QMLTP converter", function(){
  it(`should convert ${pairs[0][0]} correctly to ${pairs[0][1]}`, function(done){
    assert.equal(converter.exportFormula(pairs[0][0],0), pairs[0][1]);
    done();
  });
})

