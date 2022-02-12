# Kedao Editor-EN

> A web rich text editor based on draft-js, suitable for React framework, compatible with mainstream modern browsers.

## Please understand before using

Kedao Editor is an editor based on draft-js. Draft-js does not directly use HTML as the component state. It implements an EditorState type, which is essentially a JS object. In the traditional rich text editor, The piece of HTML content corresponding to EditorState is a block; this can be verified by looking at editorState.toRAW ().

The advantage of using EditorState instead of HTML strings is that a set of EditorState can be used on multiple ends, and the content produced by the editor is no longer limited to being displayed on the web platform (of course, each platform also needs to implement the corresponding EditorState to View conversion function) At the same time, it is more suitable for the component state of React.

However, in the above implementation, the biggest problem is that it cannot perfectly convert external HTML into EditorState, because its supported styles, tags, tag attributes, and so on are extremely limited, and there is no way to convert all the features in HTML to the state in EditorState. , When using third-party or historical HTML strings to initialize the editor content, and when pasting external HTML content, only a small number of styles and tag attributes supported by the editor can be retained, most of the content will be filtered or Ignore it.

Based on the above shortcomings, if your project strongly depends on the original HTML tags and attributes, etc., this editor is not recommended.

### Editor-specific extension packs have been released, please see [Extensions](https://github.com/banyudu/kedao/tree/main/packages/extensions)

The form extension module has been released in a test version. Please upgrade craft-editor and craft-utils to the latest version and install the latest version of craft-extensions. For the usage, please see [[form extension module](https://github.com/banyudu/kedao/tree/main/packages/extensions)]

## Features

- Perfect text content editing function
- Many open editing interfaces, good scalability
- Allows inserting multimedia content such as pictures, audio and video
- Allows to customize the upload interface of multimedia content
- Allow to set the image to float left and right (ie text wrapping function)
- Allows setting the color list, font size, and fonts available to the editor
- Allows customizing the control buttons and display order to be displayed
- Allows adding additional custom buttons
- Multi-language support (Simplified Chinese, Traditional Chinese, English, Polish, Japanese, Korean, Turkish)
- ... More features under development

## Recent updates

[View history update record](https://github.com/banyudu/kedao/blob/main/CHANGELOG.md)

## installation

```bash
# Install using yarn
yarn add kedao
# Install using npm
npm install kedao --save
```

## use

The editor supports **value** and **onChange** properties, which are similar to the native input components in React. In general, you can use this editor in the form of a typical **controlled component**:

Of course, this editor also supports the **defaultValue** property, so you can also use this editor as a **uncontrolled component**.
