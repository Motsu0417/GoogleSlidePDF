function onOpen(e) {
  SpreadsheetApp.getUi().createMenu("Addon")
    .addItem("CONVERT SLIDE", startConvertSlides.name)
    .addItem("showTestDialog", showTestDialog.name)
    .addToUi();
}

// 変換開始用メソッド
function startConvertSlides() {
  let importFolderID, exportFolderID; // 入出力フォルダのID
  let importFilesId = [], importFilesName = []; // 入力フォルダ内ファイルID,名前
  let exportFolderExsistNames = []; // 出力フォルダ内ファイル名配列
  var importFileNotes = []; // 入力ファイル備考 
  var importFolder; // 入力フォルダ
  var exportFolder; // 出力フォルダ

  var _files; // Filesのイテレータを一時保存する変数
  var _file; // Fileを一時保存する変数

  importFolderID = Browser.inputBox("入力フォルダIDかURLを入力して下さい")
  exportFolderID = Browser.inputBox("出力フォルダIDかURLを入力してください")

  // 実行時間計測用
  var time = [];
  time.push(Date.now());

  // urlをIDに置き換える
  // https://drive.google.com/drive/folders/ + {ID} + ?オプション からIDのみを抜き取る
  importFolderID = importFolderID.replace(/.*folders\//, '').replace(/\?.*/, '');
  exportFolderID = exportFolderID.replace(/.*folders\//, '').replace(/\?.*/, '');
  // console.log(importFolderID + "\n" + exportFolderID);

  // コピペ間違いをチェック
  if (importFolderID == exportFolderID) {
    // 入力フォルダと出力フォルダが同じな場合、チェック（OKの場合はそのまま実行する）
    if (Browser.msgBox('入力フォルダと出力フォルダが同じです。\n出力しますか？', Browser.Buttons.OK_CANCEL) == 'cancel') return;
  }

  try {
    // フォルダーを取得
    importFolder = DriveApp.getFolderById(importFolderID);
    exportFolder = DriveApp.getFolderById(exportFolderID);
  } catch (e) {
    // 何らかのエラーで取得できない場合はこちら
    Browser.msgBox("フォルダIDが不正です。\n" + e);
    return;
  }
  
  time.push(Date.now());

  // 入力フォルダ内ファイル取得
  _files = importFolder.getFiles();
  // 入力フォルダ内ファイル走査
  while (_files.hasNext()) {
    // ファイルを取得
    _file = _files.next();
    // 取得したファイルがGoogleSlideでない場合はスキップ
    // console.log(_file.getMimeType());
    if ('application/vnd.google-apps.presentation' != _file.getMimeType()) continue;
    // 変換対象配列に格納
    importFilesId.push(_file.getId());
    importFilesName.push(_file.getName());
  }

  time.push(Date.now());

  // 出力フォルダ内ファイル名を取得（ファイル名の重複があった場合にアラートを表示するため）
  _files = exportFolder.getFiles();
  while(_files.hasNext()){
    exportFolderExsistNames.push(_files.next().getName());
  }

  time.push(Date.now());
  // ファイル名ソート
  exportFolderExsistNames.sort();

  time.push(Date.now());
  for(let i = 0;i < importFilesName.length;i++){
    importFileNotes.push("");
    // 入力ファイル名が入力フォルダー内に重複しているかチェック
    var nameArray = importFilesName.slice(0,i).concat(importFilesName.slice(i+1,importFilesName.length));
    // 名前の重複があった場合、備考欄に記載
    if(nameArray.includes(importFilesName[i])){
      importFileNotes[i] = ("重複した名前のスライドが存在します。")
    }
    // 出力フォルダ内に入力ファイルと同名のファイルが存在しているかチェック
    if(exportFolderExsistNames.includes(importFilesName[i] + ".pdf")){
      console.log("same name:" + importFilesName[i]);
      importFileNotes[i] += (importFileNotes[i] ? "<br>":"") +("出力フォルダ内に同名のファイルが存在します。")
    }
  }
  // 備考の確認
  console.log(importFileNotes);

  time.push(Date.now());

  // htmlファイルからhtmlテンプレートを作成
  let htmlTemplate = HtmlService.createTemplateFromFile("ConvertDialog");

  // ダイアログのhtmlのスクリプト欄に挿入する値を代入していく
  htmlTemplate.importFolderName = importFolder.getName();
  htmlTemplate.exportFolderName = exportFolder.getName();
  htmlTemplate.importFolderID = importFolderID;
  htmlTemplate.exportFolderID = exportFolderID;
  htmlTemplate.importFilesId = importFilesId;
  htmlTemplate.importFilesName = importFilesName;
  htmlTemplate.importFileNotes = importFileNotes;
  // htmlTemplateを出力できる形に変換し、表示サイズを設定
  let html = htmlTemplate.evaluate()
  .setWidth(1000) 
  .setHeight(600);

  // htmlをダイアログにして表示
  SpreadsheetApp.getUi().showModalDialog(html, "出力");

  time.push(Date.now());

  // 実行時間表示
  console.log(time);
  for(var i = 0; i < time.length-1;i++){
    console.log("t" + i + "-t" + (i+1) + " = " + ((time[i+1] - time[i])/1000));
  }
  
}

// 入力ファイルIDと出力フォルダIDを受け取り、変換する
// 返り値：インデックス番号
// エラー値：-1
function convertSlide(importFileID, exportFolderID, index){
  // 入力ファイルと出力フォルダのID
  console.log("StartConvert[" + index + "]:" + importFileID + "->" + exportFolderID)
  try{
    // 出力フォルダ
    var folder = DriveApp.getFolderById(exportFolderID);
    // 入力ファイル
    var slide = DriveApp.getFileById(importFileID);
    folder.createFile(slide.getBlob().getAs(MimeType.PDF));
    return index;
  }
  catch(e){
    return -1;
  }
}

// 出力が終わったらメッセージボックスを表示
function showEndCovert(){
  Browser.msgBox("変換が終了しました。");
}

// 正規表現のチェック
function replaceTest() {
  var text = "https://drive.google.com/drive/folders/1TAgM2x_M6I7jmU8a3nArwiFew-dhXcGx?usp=sharing"
  // text = "1TAgM2x_M6I7jmU8a3nArwiFew-dhXcGx"
  var text2 = text.replace(/.*folders\//, '').replace(/\?.*/, '');
  console.log(text2);
}





