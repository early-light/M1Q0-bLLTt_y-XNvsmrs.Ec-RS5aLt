# PDF slideshow for GitHub Pages

このフォルダのファイルを、すべて同じ階層のまま
GitHubへ配置します。
公開ページは `index.html` です。

## ファイル

- `index.html`: スライドショー本体
- `ai-design-study.pdf`: 表示するPDF
- `pdf.min.mjs`: PDF.js本体
- `pdf.worker.min.mjs`: PDF.jsのWorker
- `PDFJS-LICENSE.txt`: PDF.jsのライセンス

## 操作

- 次へ: 右矢印、PageDown、Space
- 前へ: 左矢印、PageUp
- 最初／最後: Home／End
- スマートフォン: 左右スワイプ
- 画面下部のボタンから全画面表示

## ローカル確認

`index.html` を直接開かず、フォルダ内で
ローカルサーバーを起動します。

```powershell
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。
