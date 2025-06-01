import React, { useState } from 'react'

const SessionItem = ({ sessionName, onSelect }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className='group relative mx-2 mb-1 rounded-lg cursor-pointer' onClick={onSelect}>
      <div className="flex items-start justify-between gap-3 p-3">
        <p>
            {sessionName}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          btn
        </button>
      </div>

      {showMenu && (
        <div className="flex flex-col">
          <button>Rename</button>
          <button>Delete</button>
        </div>
      )}
    </div>
  )
}

export default SessionItem
