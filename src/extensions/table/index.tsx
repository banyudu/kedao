import './style.scss'
import React from 'react'
import { registerStrictBlockType } from '../../utils'
import {
  handleKeyCommand,
  handleReturn,
  handleDroppedFiles,
  handlePastedFiles,
  handlePastedText
} from './handlers'
import { getLanguage, tableRenderMap } from './render'
import DropdownControl from './dropdown'
import * as _TableUtils from './utils'
import { tableImportFn, tableExportFn } from './converts'
import { MdGridOn } from 'react-icons/md'
import { defaultIconProps } from '../../configs/props'

registerStrictBlockType('table-cell')

export let dropdownInstance = null

const dropdownRef = (instance) => {
  dropdownInstance = instance
  return dropdownInstance
}

export const TableUtils = _TableUtils

export default (options) => {
  options = {
    defaultColumns: 3,
    defaultRows: 3,
    withDropdown: false,
    columnResizable: false,
    exportAttrString: '',
    ...options
  }

  const {
    includeEditors,
    excludeEditors,
    defaultColumns,
    defaultRows,
    withDropdown,
    exportAttrString
  } = options

  const controlItem = withDropdown
    ? {
        type: 'control',
        includeEditors,
        excludeEditors,
        control: (props) => {
          const language = getLanguage(props.editor)
          return {
            key: 'table',
            replace: 'table',
            type: 'dropdown',
            title: language.insertTable,
            text: <MdGridOn {...defaultIconProps} />,
            showArrow: false,
            autoHide: true,
            ref: dropdownRef,
            component: (
              <DropdownControl
                language={language}
                defaultRows={defaultRows}
                defaultColumns={defaultColumns}
                onConfirm={({ columns, rows }) => {
                  props.editor.setValue(
                    TableUtils.insertTable(props.editorState, columns, rows)
                  )
                  dropdownInstance?.hide()
                }}
              />
            )
          }
        }
      }
    : {
        type: 'control',
        includeEditors,
        excludeEditors,
        control: (props) => {
          return {
            key: 'table',
            replace: 'table',
            type: 'button',
            title: getLanguage(props.editor).insertTable,
            text: <MdGridOn {...defaultIconProps} />,
            onClick: () => {
              props.editor.setValue(
                TableUtils.insertTable(
                  props.editorState,
                  defaultColumns,
                  defaultRows
                )
              )
            }
          }
        }
      }

  return [
    controlItem,
    {
      type: 'prop-interception',
      includeEditors,
      excludeEditors,
      interceptor: (editorProps) => {
        editorProps.handleKeyCommand = handleKeyCommand(
          editorProps.handleKeyCommand
        )
        editorProps.handleReturn = handleReturn(editorProps.handleReturn)
        editorProps.handleDroppedFiles = handleDroppedFiles(
          editorProps.handleDroppedFiles
        )
        editorProps.handlePastedFiles = handlePastedFiles(
          editorProps.handlePastedFiles
        )
        editorProps.handlePastedText = handlePastedText(
          editorProps.handlePastedText
        )
        return editorProps
      }
    },
    {
      type: 'block',
      name: 'table-cell',
      includeEditors,
      excludeEditors,
      renderMap: tableRenderMap(options),
      importer: tableImportFn,
      exporter: tableExportFn(exportAttrString)
    }
  ]
}
