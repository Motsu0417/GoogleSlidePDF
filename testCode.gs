function callFromHTML() {
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange("A1").setValue("hello");
}

function showTestDialog(){
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createTemplateFromFile("testDialog").evaluate(),"Dialog");
}
