import { useState } from 'react';
import { BiDotsVerticalRounded } from "react-icons/bi";

const SessionItem = ({ sessionName, onSelect }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className='group relative mx-2 rounded-4xl hover:bg-gray-300 hover:{showMenu=true} cursor-pointer' onClick={onSelect}>
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <p>
            {sessionName}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="hidden group-hover:flex cursor-pointer"
        >
          <BiDotsVerticalRounded className="w-5 h-5"/>
        </button>
      </div>
    </div>
  )
}

export default SessionItem
