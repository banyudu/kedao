import { CallbackEditor } from '../../types'
import React, { useRef, useState, useEffect } from 'react'
import Immutable from 'immutable'
import languages from './languages'
import * as TableUtils from './utils'
import Editor from '../../editor'
import { MdAdd, MdDelete } from 'react-icons/md'
import { defaultIconProps } from '../../configs/props'

const getIndexFromEvent = (event, ignoredTarget = '') => {
  if (!isNaN(event)) {
    return event * 1
  } else if (
    ignoredTarget &&
    event &&
    event.target &&
    event.target.dataset.role === ignoredTarget
  ) {
    return false
  } else if (event?.currentTarget?.dataset.index) {
    return event.currentTarget.dataset.index * 1
  }

  return false
}

export const getLanguage = (editor: CallbackEditor) => {
  const lang = editor.editorProps.language

  if (typeof lang === 'function') {
    return lang(languages, 'kedao')
  } else {
    return languages[lang] || languages.zh
  }
}

export const Table = ({ editor, editorState, children = [], columnResizable }) => {
  const [tableRows, setTableRows] = useState([])
  const [colToolHandlers, setColToolHandlers] = useState([])
  const [rowToolHandlers, setRowToolHandlers] = useState([])
  const [defaultColWidth, setDefaultColWidth] = useState(0)
  const [colResizing, setColResizing] = useState(false)
  const [colResizeOffset, setColResizeOffset] = useState(0)
  const [selectedCells, setSelectedCells] = useState([])
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1)
  const [selectedColumnIndex, setSelectedColumnIndex] = useState(-1)
  const [dragSelecting, setDragSelecting] = useState(false)
  const [draggingRectBounding, setDraggingRectBounding] = useState(null)
  const [cellsMergeable, setCellsMergeable] = useState(false)
  const [cellSplittable, setCellSplittable] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState(null)

  const languageRef = useRef(getLanguage(editor))
  const tableRef = useRef(null)
  const rowRefs = useRef([])
  const colRefs = useRef([])

  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, tableRows.length)
  }, [tableRows.length])

  useEffect(() => {
    colRefs.current = colRefs.current.slice(0, colToolHandlers.length)
  }, [colToolHandlers.length])

  const colResizeIndexRef = useRef(0)
  const colResizeStartAtRef = useRef(0)

  const colLengthRef = useRef(0)

  const startCellKeyRef = useRef(null)
  const endCellKeyRef = useRef(null)

  const dragSelectingRef = useRef(false)
  const dragSelectedRef = useRef(false)
  const dragSelectingStartColumnIndexRef = useRef(null)
  const dragSelectingStartRowIndexRef = useRef(null)
  const dragSelectingEndColumnIndexRef = useRef(null)
  const dragSelectingEndRowIndexRef = useRef(null)
  const draggingRectBoundingUpdatingRef = useRef(false)
  const draggingStartPointRef = useRef({ x: 0, y: 0 })
  // const selectedCellsClearedRef = useRef(false);

  const tableKeyRef = useRef(null)

  useEffect(() => {
    renderCells()
  }, [
    selectedColumnIndex,
    selectedRowIndex,
    cellSplittable,
    cellsMergeable,
    selectedCells
  ])

  const handleToolbarMouseDown = event => {
    event.preventDefault()
  }

  const handleKeyDown = event => {
    if (event.keyCode === 8) {
      if (selectedColumnIndex > -1) {
        removeColumn()
        event.preventDefault()
      } else if (selectedRowIndex > -1) {
        removeRow()
        event.preventDefault()
      }
    }
  }

  const handleMouseUp = event => {
    if (event.button !== 0) {
      return
    }

    if (colResizing) {
      const nextColToolHandlers = [...colToolHandlers]

      nextColToolHandlers[colResizeIndexRef.current - 1].width =
        (nextColToolHandlers[colResizeIndexRef.current - 1].width ||
          defaultColWidth) + colResizeOffset
      nextColToolHandlers[colResizeIndexRef.current].width =
        (nextColToolHandlers[colResizeIndexRef.current].width ||
          defaultColWidth) - colResizeOffset

      colResizeIndexRef.current = 0
      colResizeStartAtRef.current = 0

      setContextMenuPosition(null)
      setColToolHandlers(nextColToolHandlers)
      setColResizeOffset(0)
      setColResizing(false)

      renderCells()
      updateCellsData({
        colgroupData: nextColToolHandlers.map(item => ({
          width: item.width
        }))
      })
    } else {
      setContextMenuPosition(null)
    }
  }

  const handleMouseMove = event => {
    if (colResizing) {
      setColResizeOffset(
        getResizeOffset(event.clientX - colResizeStartAtRef.current)
      )
    }
  }

  const handleColResizerMouseDown = event => {
    colResizeIndexRef.current = event.currentTarget.dataset.index * 1
    colResizeStartAtRef.current = event.clientX
    setColResizing(true)
  }

  const handleCellContexrMenu = event => {
    const { cellKey } = event.currentTarget.dataset

    if (!~selectedCells.indexOf(cellKey)) {
      selectCell(event)
    }

    const {
      top: tableTop,
      left: tableLeft,
      width: tableWidth
    } = tableRef.current?.getBoundingClientRect()
    const top = event.clientY - tableTop + 15
    let left = event.clientX - tableLeft + 10

    if (left + 150 > tableWidth) {
      left = tableWidth - 150
    }

    setContextMenuPosition({ top, left })

    event.preventDefault()
  }

  const handleContextMenuContextMenu = event => {
    event.preventDefault()
  }

  const handleCellMouseDown = event => {
    if (colResizing) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    dragSelectingRef.current = true
    dragSelectingStartColumnIndexRef.current =
      event.currentTarget.dataset.colIndex
    dragSelectingStartRowIndexRef.current = event.currentTarget.dataset.rowIndex

    draggingStartPointRef.current = {
      x: event.clientX,
      y: event.clientY
    }

    setDragSelecting(true)
  }

  const handleCellMouseUp = () => {
    dragSelectingRef.current = false
    dragSelectedRef.current = false
    dragSelectingStartColumnIndexRef.current = null
    dragSelectingStartRowIndexRef.current = null
    dragSelectingEndColumnIndexRef.current = null
    dragSelectingEndRowIndexRef.current = null

    setDragSelecting(false)
    setDraggingRectBounding(null)
  }

  const handleCellMouseEnter = event => {
    if (dragSelectingRef.current) {
      dragSelectingEndColumnIndexRef.current =
        event.currentTarget.dataset.colIndex
      dragSelectingEndRowIndexRef.current = event.currentTarget.dataset.rowIndex

      if (
        dragSelectingEndColumnIndexRef.current !==
          dragSelectingStartColumnIndexRef.current ||
        dragSelectingEndRowIndexRef.current !==
          dragSelectingStartRowIndexRef.current
      ) {
        dragSelectedRef.current = true
        event.preventDefault()
      } else {
        dragSelectedRef.current = false
      }

      confirmDragSelecting()
    }
  }

  const handleTableMouseMove = event => {
    if (dragSelectingRef.current && dragSelectedRef.current) {
      updateDraggingRectBounding(event)
      event.preventDefault()
    }
  }

  const handleTableMouseLeave = event => {
    if (
      dragSelectingRef.current &&
      event.currentTarget &&
      event.currentTarget.dataset.role === 'table'
    ) {
      handleCellMouseUp()
    }

    event.preventDefault()
  }

  const confirmDragSelecting = () => {
    if (
      !dragSelectingStartColumnIndexRef.current ||
      !dragSelectingStartRowIndexRef.current ||
      !dragSelectingEndColumnIndexRef.current ||
      !dragSelectingEndRowIndexRef.current
    ) {
      return
    }

    const {
      cellKeys: selectedCells,
      spannedCellBlockKeys
    } = TableUtils.getCellsInsideRect(
      editorState,
      tableKeyRef.current,
      [
        dragSelectingStartColumnIndexRef.current,
        dragSelectingStartRowIndexRef.current
      ],
      [
        dragSelectingEndColumnIndexRef.current,
        dragSelectingEndRowIndexRef.current
      ]
    ) as any

    if (selectedCells.length < 2) {
      return
    }

    setSelectedColumnIndex(-1)
    setSelectedRowIndex(-1)
    setCellsMergeable(spannedCellBlockKeys.length === 0)
    setCellSplittable(false)
    setSelectedCells(selectedCells)
  }

  const updateDraggingRectBounding = mouseEvent => {
    if (draggingRectBoundingUpdatingRef.current || !dragSelectingRef.current) {
      return
    }

    draggingRectBoundingUpdatingRef.current = true

    const tableBounding = tableRef.current?.getBoundingClientRect()
    const { x: startX, y: startY } = draggingStartPointRef.current
    const { clientX: currentX, clientY: currentY } = mouseEvent

    const draggingRectBounding: any = {}

    if (currentX <= startX) {
      draggingRectBounding.right =
        tableBounding.left + tableBounding.width - startX
    } else {
      draggingRectBounding.left = startX - tableBounding.left + 9
    }

    if (currentY <= startY) {
      draggingRectBounding.bottom =
        tableBounding.top + tableBounding.height - startY
    } else {
      draggingRectBounding.top = startY - tableBounding.top + 9
    }

    draggingRectBounding.width = Math.abs(currentX - startX)
    draggingRectBounding.height = Math.abs(currentY - startY)

    setDraggingRectBounding(draggingRectBounding)
    setTimeout(() => {
      draggingRectBoundingUpdatingRef.current = false
    }, 100)
  }

  const selectCell = event => {
    const { cellKey } = event.currentTarget.dataset
    const { colSpan, rowSpan } = event.currentTarget

    const nextSelectedCells = ~selectedCells.indexOf(cellKey) ? [] : [cellKey]
    const cellSplittable =
      nextSelectedCells.length && (colSpan > 1 || rowSpan > 1)

    setSelectedCells(nextSelectedCells)
    setCellSplittable(cellSplittable)
    setCellsMergeable(false)
    setSelectedRowIndex(-1)
    setSelectedColumnIndex(-1)
  }

  const selectColumn = event => {
    const newSelectedColumnIndex = getIndexFromEvent(event, 'insert-column')

    if (newSelectedColumnIndex === false) {
      return
    }

    if (newSelectedColumnIndex === selectedColumnIndex) {
      setSelectedCells([])
      setCellsMergeable(false)
      setCellSplittable(false)
      setSelectedColumnIndex(-1)
      return
    }

    const {
      cellKeys: selectedCells,
      spannedCellBlockKeys
    } = TableUtils.getCellsInsideRect(
      editorState,
      tableKeyRef.current,
      [newSelectedColumnIndex, 0],
      [newSelectedColumnIndex, rowToolHandlers.length - 1]
    ) as any

    setSelectedColumnIndex(newSelectedColumnIndex)
    setSelectedRowIndex(-1)
    setCellSplittable(false)
    setCellsMergeable(spannedCellBlockKeys.length === 0)
    setSelectedCells(selectedCells)
  }

  const selectRow = event => {
    const newSelectedRowIndex = getIndexFromEvent(event, 'insert-row')

    if (newSelectedRowIndex === false) {
      return
    }

    if (newSelectedRowIndex === selectedRowIndex) {
      setSelectedCells([])
      setCellsMergeable(false)
      setCellSplittable(false)
      setSelectedRowIndex(-1)
      return
    }

    const {
      cellKeys: selectedCells,
      spannedCellBlockKeys
    } = TableUtils.getCellsInsideRect(
      editorState,
      tableKeyRef.current,
      [0, newSelectedRowIndex],
      [colToolHandlers.length, newSelectedRowIndex]
    ) as any

    setSelectedColumnIndex(-1)
    setSelectedRowIndex(newSelectedRowIndex)
    setCellSplittable(false)
    setCellsMergeable(spannedCellBlockKeys.length === 0)
    setSelectedCells(selectedCells)
  }

  const insertColumn = event => {
    const columnIndex = getIndexFromEvent(event)

    if (columnIndex === false) {
      return
    }

    const nextColToolHandlers = colToolHandlers.map(item => ({
      ...item,
      width: 0
    }))

    setSelectedCells([])
    setSelectedRowIndex(-1)
    setSelectedRowIndex(-1)
    setColToolHandlers(nextColToolHandlers)

    editor.setValue(
      TableUtils.insertColumn(
        editorState,
        tableKeyRef.current,
        tableRows.length,
        columnIndex
        // nextColToolHandlers
      )
    )
  }

  const removeColumn = () => {
    const nextColToolHandlers = colToolHandlers.map(item => ({
      ...item,
      width: 0
    }))

    if (selectedColumnIndex >= 0) {
      setSelectedColumnIndex(-1)
      setColToolHandlers(nextColToolHandlers)
      editor.draftInstance.blur()
      setImmediate(() => {
        const result = TableUtils.removeColumn(
          editorState,
          tableKeyRef.current,
          selectedColumnIndex
          // nextColToolHandlers
        )
        editor.setValue(validateContent(result))
      })
    }
  }

  const insertRow = event => {
    const rowIndex = getIndexFromEvent(event)

    if (rowIndex === false) {
      return
    }

    setSelectedCells([])
    setSelectedRowIndex(-1)
    setSelectedColumnIndex(-1)

    editor.setValue(
      TableUtils.insertRow(
        editorState,
        tableKeyRef.current,
        colLengthRef.current,
        rowIndex
      )
    )
  }

  // 校验一下删除行、列之后的内容还有没有，没有的话则创建一个空的editorState，防止后续取不到值报错
  const validateContent = editorState => {
    const len = editorState.toRAW(true).blocks.length
    return len ? editorState : (Editor as any).createEditorState(null)
  }

  const removeRow = () => {
    if (selectedRowIndex >= 0) {
      setSelectedRowIndex(-1)
      editor.draftInstance.blur()
      setImmediate(() => {
        const result = TableUtils.removeRow(
          editorState,
          tableKeyRef.current,
          selectedRowIndex
        )
        editor.setValue(validateContent(result))
      })
    }
  }

  const mergeCells = () => {
    if (cellsMergeable && selectedCells.length > 1) {
      setSelectedCells([selectedCells[0]])
      setCellSplittable(true)
      setCellsMergeable(false)
      setSelectedRowIndex(-1)
      setSelectedColumnIndex(-1)

      editor.setValue(
        TableUtils.mergeCells(
          editorState,
          tableKeyRef.current,
          selectedCells
        )
      )
    }
  }

  const splitCell = () => {
    if (cellSplittable && selectedCells.length === 1) {
      setCellSplittable(false)
      setCellsMergeable(false)
      setSelectedRowIndex(-1)
      setSelectedColumnIndex(-1)
      editor.setValue(
        TableUtils.splitCell(editorState, tableKeyRef.current, selectedCells[0])
      )
    }
  }

  const removeTable = () => {
    editor.setValue(TableUtils.removeTable(editorState, tableKeyRef.current))
  }

  useEffect(() => {
    renderCells()
    document.body.addEventListener('keydown', handleKeyDown, false)
    document.body.addEventListener('mousemove', handleMouseMove, false)
    document.body.addEventListener('mouseup', handleMouseUp, false)

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown, false)
      document.body.removeEventListener('mousemove', handleMouseMove, false)
      document.body.removeEventListener('mouseup', handleMouseUp, false)
    }
  }, [])

  const getResizeOffset = offset => {
    let leftLimit = 0
    let rightLimit = 0

    leftLimit =
      -1 *
      ((colToolHandlers[colResizeIndexRef.current - 1].width ||
        defaultColWidth) -
        30)
    rightLimit =
      (colToolHandlers[colResizeIndexRef.current].width || defaultColWidth) - 30

    offset = offset < leftLimit ? leftLimit : offset
    offset = offset > rightLimit ? rightLimit : offset

    return offset
  }

  const adjustToolbarHandlers = () => {
    let needUpdate = false
    const newRowToolHandlers = [...rowToolHandlers]

    rowRefs.current?.forEach((ref, index) => {
      const rowHeight = ref
        ? ref.getBoundingClientRect().height
        : 40
      if (
        newRowToolHandlers[index] &&
        newRowToolHandlers[index].height !== rowHeight
      ) {
        needUpdate = true
        newRowToolHandlers[index].height = rowHeight
      }
    })

    if (needUpdate) {
      setRowToolHandlers(newRowToolHandlers)
    }
  }

  const updateCellsData = blockData => {
    editor.setValue(
      TableUtils.updateAllTableBlocks(
        editorState,
        tableKeyRef.current,
        blockData
      )
    )
  }

  const renderCells = () => {
    colLengthRef.current = 0

    const tableRows = []
    const colToolHandlers = []
    const rowToolHandlers = []
    const tableWidth = tableRef.current?.getBoundingClientRect().width

    startCellKeyRef.current = children[0].key
    endCellKeyRef.current = children[children.length - 1].key

    children.forEach((cell, cellIndex) => {
      const cellBlock = editorState.getCurrentContent().getBlockForKey(cell.key)
      const cellBlockData = cellBlock.getData()
      const tableKey = cellBlockData.get('tableKey')
      const colIndex = cellBlockData.get('colIndex') * 1
      const rowIndex = cellBlockData.get('rowIndex') * 1
      const colSpan = cellBlockData.get('colSpan')
      const rowSpan = cellBlockData.get('rowSpan')

      tableKeyRef.current = tableKey
      if (rowIndex === 0) {
        const colgroupData = cellBlockData.get('colgroupData') || []
        const totalColgroupWidth = colgroupData.reduce(
          (width, col) => width + col.width * 1,
          0
        )
        const colSpan = (cellBlockData.get('colSpan') || 1) * 1
        for (
          let ii = colLengthRef.current;
          ii < colLengthRef.current + colSpan;
          ii++
        ) {
          colToolHandlers[ii] = {
            key: cell.key,
            width: colToolHandlers[ii]
              ? colToolHandlers[ii].width
              : colgroupData[ii]
                ? (colgroupData[ii].width / totalColgroupWidth) * tableWidth * 1
                : 0
          }
        }

        colLengthRef.current += colSpan
      }

      const newCell = React.cloneElement(cell, {
        'data-active': !!~selectedCells.indexOf(cell.key),
        'data-row-index': rowIndex,
        'data-col-index': colIndex || (tableRows[rowIndex] || []).length,
        'data-cell-index': cellIndex,
        'data-cell-key': cell.key,
        'data-table-key': tableKey,
        className: `bf-table-cell ${cell.props.className}`,
        colSpan: colSpan,
        rowSpan: rowSpan,
        onClick: selectCell,
        onContextMenu: handleCellContexrMenu,
        onMouseDown: handleCellMouseDown,
        onMouseUp: handleCellMouseUp,
        onMouseEnter: handleCellMouseEnter
      })

      for (let jj = rowIndex; jj < rowIndex + rowSpan; jj++) {
        rowToolHandlers[jj] = { key: cell.key, height: 0 }
        tableRows[jj] = tableRows[jj] || []
      }

      if (!tableRows[rowIndex]) {
        tableRows[rowIndex] = [newCell]
      } else {
        tableRows[rowIndex].push(newCell)
      }
    })

    const defaultColWidth = tableWidth / colLengthRef.current
    setTableRows(tableRows)
    setColToolHandlers(colToolHandlers)
    setRowToolHandlers(rowToolHandlers)
    setDefaultColWidth(defaultColWidth)
    adjustToolbarHandlers()
  }

  const createColGroup = () => {
    return (
      <colgroup>
        {colToolHandlers.map((item, index) => (
          <col
            ref={ref => (colRefs.current[index] = ref)}
            width={item.width || defaultColWidth}
            key={index}
          ></col>
        ))}
      </colgroup>
    )
  }

  const createColTools = () => {
    return (
      <div
        data-active={selectedColumnIndex >= 0}
        contentEditable={false}
        data-key='bf-col-toolbar'
        className={`bf-table-col-tools${colResizing ? ' resizing' : ''}`}
        onMouseDown={handleToolbarMouseDown}
      >
        {colToolHandlers.map((item, index) => (
          <div
            key={index}
            data-key={item.key}
            data-index={index}
            data-active={selectedColumnIndex == index}
            className='bf-col-tool-handler'
            style={{ width: item.width || defaultColWidth }}
            onClick={selectColumn}
          >
            {columnResizable && index !== 0
              ? (
              <div
                data-index={index}
                data-key={item.key}
                className={`bf-col-resizer${
                  colResizing && colResizeIndexRef.current === index
                    ? ' active'
                    : ''
                }`}
                style={
                  colResizing && colResizeIndexRef.current === index
                    ? { transform: `translateX(${colResizeOffset}px)` }
                    : null
                }
                onMouseDown={handleColResizerMouseDown}
              ></div>
                )
              : null}
            <div className='bf-col-tool-left'>
              <div
                data-index={index}
                data-role='insert-column'
                className='bf-insert-col-before'
                onClick={insertColumn}
              >
                <MdAdd {...defaultIconProps} />
              </div>
            </div>
            <div className='bf-col-tool-center'>
              <div
                data-index={index}
                data-role='remove-col'
                className='bf-remove-col'
                onClick={removeColumn}
              >
                <MdDelete {...defaultIconProps} />
              </div>
            </div>
            <div className='bf-col-tool-right'>
              <div
                data-index={index + 1}
                data-role='insert-column'
                className='bf-insert-col-after'
                onClick={insertColumn}
              >
                <MdAdd {...defaultIconProps} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const createRowTools = () => {
    return (
      <div
        data-active={selectedRowIndex >= 0}
        contentEditable={false}
        className='bf-table-row-tools'
        onMouseDown={handleToolbarMouseDown}
      >
        {rowToolHandlers.map((item, index) => (
          <div
            key={index}
            data-key={item.key}
            data-index={index}
            data-active={selectedRowIndex == index}
            className='bf-row-tool-handler'
            style={{ height: item.height }}
            onClick={selectRow}
          >
            <div className='bf-row-tool-up'>
              <div
                data-index={index}
                data-role='insert-row'
                className='bf-insert-row-before'
                onClick={insertRow}
              >
                <MdAdd {...defaultIconProps} />
              </div>
            </div>
            <div className='bf-row-tool-center'>
              <div
                data-index={index}
                data-role='remove-row'
                className='bf-remove-row'
                onClick={removeRow}
              >
                <MdDelete {...defaultIconProps} />
              </div>
            </div>
            <div className='bf-row-tool-down'>
              <div
                data-index={index + 1}
                data-role='insert-row'
                className='bf-insert-row-after'
                onClick={insertRow}
              >
                <MdAdd {...defaultIconProps} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const createContextMenu = () => {
    if (!contextMenuPosition) {
      return null
    }

    return (
      <div
        className='bf-table-context-menu'
        onContextMenu={handleContextMenuContextMenu}
        contentEditable={false}
        style={contextMenuPosition}
      >
        <div
          className='context-menu-item'
          onMouseDown={mergeCells}
          data-disabled={!cellsMergeable}
        >
          {languageRef.current.mergeCells}
        </div>
        <div
          className='context-menu-item'
          onMouseDown={splitCell}
          data-disabled={!cellSplittable}
        >
          {languageRef.current.splitCell}
        </div>
        <div className='context-menu-item' onMouseDown={removeTable}>
          {languageRef.current.removeTable}
        </div>
      </div>
    )
  }

  const { readOnly } = editor.props

  return (
    <div className='bf-table-container'>
      <table
        data-role='table'
        className={`bf-table${dragSelecting ? ' dragging' : ''}`}
        ref={tableRef}
        onMouseMove={handleTableMouseMove}
        onMouseLeave={handleTableMouseLeave}
      >
        {createColGroup()}
        <tbody>
          {tableRows.map((cells, rowIndex) => (
            <tr ref={ref => (rowRefs.current[rowIndex] = ref)} key={rowIndex}>
              {cells}
            </tr>
          ))}
        </tbody>
      </table>
      {dragSelecting
        ? (
        <div className='dragging-rect' style={draggingRectBounding} />
          )
        : null}
      {!readOnly && createContextMenu()}
      {!readOnly && createColTools()}
      {!readOnly && createRowTools()}
    </div>
  )
}

export const tableRenderMap = options => props => {
  return Immutable.Map({
    'table-cell': {
      element: 'td',
      wrapper: (
        <Table
          columnResizable={options.columnResizable}
          editor={props.editor}
          editorState={props.editorState}
        />
      )
    }
  })
}
