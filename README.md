# 勉強会の教材

GitHub Pagesで公開する教材一覧とPDFスライドビューアーです。

## 公開ページ

- `/`：教材一覧
- `/security-study-20261116/`：セキュリティ勉強会（2026年11月16日、49枚）
- `/security-study-20261116/slides.pdf`：同教材の完成版PDF
- `/ai-design-study/`：AIと一緒にデザインを考える（33枚）
- `/ai-design-study.pdf`、`/slide-contents.pdf`：従来のPDF。既存リンクのため、そのまま保持

以前のトップページへの `#page=N` 付きリンクは、前回教材の同じページへ移動します。
PowerPoint編集用ファイルや作業記録は公開対象に含めません。

## 操作

- 次へ：右矢印、PageDown、Space
- 前へ：左矢印、PageUp
- 最初／最後：Home／End
- ページ番号の入力：指定ページへ移動
- スマートフォン：左右スワイプ
- 全画面ボタン：全画面の開始／終了（対応ブラウザのみ）
- スライド内の出典リンク：新しいタブで開く

PDF.js本体、Worker、ライセンスは同梱しています。外部CDNや解析サービスは使用しません。

## ローカル確認

`index.html` を直接開かず、リポジトリをルートにHTTPサーバーを起動します。

```powershell
python -m http.server 8000
```

`http://localhost:8000/` を開きます。GitHub Pagesの公開元は `main` ブランチのルートです。
