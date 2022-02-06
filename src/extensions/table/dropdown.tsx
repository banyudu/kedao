import React, { useState } from 'react'
import './style.scss'

const Dropdown = ({ onConfirm, language, defaultRows, defaultColumns }) => {
  const [rows, setRows] = useState(defaultRows ?? 3)
  const [columns, setColumns] = useState(defaultColumns ?? 3)

  const confirmInsert = () => {
    onConfirm({ rows, columns })
  }

  return (
    <div className='bf-table-dropdown-control'>
      <input
        placeholder={language.columns}
        className='input'
        type='text'
        name='columns'
        value={columns}
        onChange={e => setColumns(e.target.value)}
      />
      <label className='label'>x</label>
      <input
        placeholder={language.rows}
        className='input'
        type='text'
        name='rows'
        value={rows}
        onChange={e => setRows(e.target.value)}
      />
      <button
        disabled={!rows || !columns}
        className='button primary'
        onClick={confirmInsert}
      >
        {language.insertTable}
      </button>
    </div>
  )
}

export default Dropdown
