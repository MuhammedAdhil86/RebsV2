import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AiOutlineClose } from 'react-icons/ai'; // Import the close icon from react-icons

const AddNote = ({ onClose, onSubmit }) => {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (note.trim() === '') {
      toast.error('Please write a note before submitting.');
      return;
    }
    // Pass the note to Approve.js using onSubmit
    onSubmit(note);
    // Close the drawer using onClose
    onClose();
  };

  return (
    <div>
       <button
        className="absolute font-semibold right-8 top-6 text-black "
        onClick={onClose}
        aria-label="Close"
      >
        <AiOutlineClose size={24} />
      </button>
    <div className="p-6 mt-8 ">
      <Toaster />
      {/* Close Icon */}
     

      {/* Title and Description */}
      <div className="pb-5 text-black font-semibold text-xl">
        Write the Note Here
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Please enter the details of your note in the text field below.
      </p>

      {/* Textarea */}
      <div>
        <textarea
          className="w-full text-black h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        ></textarea>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          className="mt-4 w-[20%] bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-all"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
    </div>
  );
};

export default AddNote;
