import React, { useState, useRef } from 'react';
import { PlusCircle, Trash2, GripHorizontal } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Toaster, toast } from 'react-hot-toast';

const EMOTIONS = [
  { label: '😊 Delighted', value: 'delighted' },
  { label: '🙂 Satisfied', value: 'satisfied' },
  { label: '😐 Neutral', value: 'neutral' },
  { label: '😕 Confused', value: 'confused' },
  { label: '😟 Frustrated', value: 'frustrated' },
  { label: '😠 Angry', value: 'angry' },
  { label: '😢 Disappointed', value: 'disappointed' }
];

function App() {
  const [stages, setStages] = useState([
    { id: 1, title: 'Edit stage name', emotion: 'neutral' }
  ]);
  
  const [touchpoints, setTouchpoints] = useState([]);
  const [editingTouchpointId, setEditingTouchpointId] = useState(null);
  const [draggedStage, setDraggedStage] = useState(null);
  const captureRef = useRef(null);

  const captureScreen = async () => {
    try {
      if (!captureRef.current) return;

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#f3f4f6',
        windowWidth: captureRef.current.scrollWidth + 200,
        windowHeight: captureRef.current.scrollHeight + 200,
        x: -100,
        y: -20,
        width: captureRef.current.scrollWidth + 200,
        height: captureRef.current.scrollHeight + 40,
        logging: false,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('.capture-container');
          if (element) {
            element.style.transform = 'none';
            element.style.WebkitTransform = 'none';
          }
        }
      });

      // Convert to blob
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error('Failed to create blob');
          
          // Copy to clipboard
          const data = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([data]);
          
          toast.success('Journey map copied to clipboard!');
        } catch (error) {
          console.error('Clipboard error:', error);
          toast.error('Failed to copy to clipboard. Downloading instead...');
          
          // Fallback to download if clipboard fails
          const link = document.createElement('a');
          link.download = 'customer-journey-map.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture journey map');
    }
  };

  const addStage = () => {
    const newStage = {
      id: Math.max(...stages.map(s => s.id), 0) + 1,
      title: 'Edit stage name',
      emotion: 'neutral'
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (stageId) => {
    setStages(stages.filter(s => s.id !== stageId));
    setTouchpoints(touchpoints.filter(t => t.stageId !== stageId));
  };

  const updateStageTitle = (id, title) => {
    setStages(stages.map(s => 
      s.id === id ? { ...s, title } : s
    ));
  };

  const updateStageEmotion = (id, emotion) => {
    setStages(stages.map(s => 
      s.id === id ? { ...s, emotion } : s
    ));
  };

  // Stage drag and drop handlers
  const handleStageDragStart = (e, stage) => {
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStageDragEnd = () => {
    setDraggedStage(null);
  };

  const handleStageDragOver = (e, targetStage) => {
    e.preventDefault();
    if (!draggedStage || targetStage.id === draggedStage.id) return;

    const newStages = [...stages];
    const draggedIdx = stages.findIndex(s => s.id === draggedStage.id);
    const targetIdx = stages.findIndex(s => s.id === targetStage.id);
    
    newStages.splice(draggedIdx, 1);
    newStages.splice(targetIdx, 0, draggedStage);
    
    setStages(newStages);
  };

  const addTouchpoint = (stageId) => {
    const newTouchpoint = {
      id: Math.random().toString(36).slice(2),
      content: 'Click to edit',
      stageId
    };
    setTouchpoints([...touchpoints, newTouchpoint]);
  };

  const updateTouchpointContent = (id, content) => {
    setTouchpoints(touchpoints.map(t => 
      t.id === id ? { ...t, content } : t
    ));
  };

  const deleteTouchpoint = (id) => {
    setTouchpoints(touchpoints.filter(t => t.id !== id));
  };

  const handleTouchpointDragStart = (e, touchpoint) => {
    e.stopPropagation(); // Prevent stage drag from triggering
    e.dataTransfer.setData('touchpointId', touchpoint.id);
  };

  const handleTouchpointDrop = (e, stageId) => {
    e.preventDefault();
    const touchpointId = e.dataTransfer.getData('touchpointId');
    if (!touchpointId) return;

    setTouchpoints(touchpoints.map(t => 
      t.id === touchpointId ? { ...t, stageId } : t
    ));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-right" />
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Linear Customer Journey Map</h1>
          <button
            onClick={captureScreen}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors border border-green-500"
          >
            📸 Capture Screenshot
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Map out your customer's journey by adding stages and touchpoints. Edit stage titles by clicking on them, 
          add touchpoints to each stage, and set the emotional state for different phases of the journey. 
          Drag and drop touchpoints between stages to reorganize your journey map. Reorder stages by dragging them horizontally.
        </p>
      </div>
      
      <div 
        ref={captureRef}
        className="flex gap-4 pb-6 overflow-x-auto capture-container"
      >
        {stages.map(stage => (
          <div 
            key={stage.id}
            draggable
            onDragStart={(e) => handleStageDragStart(e, stage)}
            onDragOver={(e) => handleStageDragOver(e, stage)}
            onDragEnd={handleStageDragEnd}
            onDrop={(e) => handleTouchpointDrop(e, stage.id)}
            className="bg-white p-4 rounded-lg shadow-md min-w-64 max-w-64 flex-shrink-0 cursor-move"
          >
            <div className="flex items-center gap-2 mb-4">
              <GripHorizontal className="w-5 h-5 text-gray-400" />
              <div className="flex-grow flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={stage.title}
                  onChange={(e) => updateStageTitle(stage.id, e.target.value)}
                  className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 p-1 flex-grow min-w-0"
                />
                <button
                  onClick={() => removeStage(stage.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 min-h-48">
              {touchpoints
                .filter(t => t.stageId === stage.id)
                .map(touchpoint => (
                  <div
                    key={touchpoint.id}
                    draggable
                    onDragStart={(e) => handleTouchpointDragStart(e, touchpoint)}
                    className="bg-yellow-50 p-3 rounded shadow-sm cursor-move relative group border border-yellow-200"
                  >
                    {editingTouchpointId === touchpoint.id ? (
                      <input
                        type="text"
                        value={touchpoint.content}
                        onChange={(e) => updateTouchpointContent(touchpoint.id, e.target.value)}
                        onBlur={() => setEditingTouchpointId(null)}
                        autoFocus
                        className="w-full bg-transparent focus:outline-none"
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingTouchpointId(touchpoint.id)}
                        className="min-h-8"
                      >
                        {touchpoint.content}
                      </div>
                    )}
                    <button
                      onClick={() => deleteTouchpoint(touchpoint.id)}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm p-1"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
            </div>
            
            <button
              onClick={() => addTouchpoint(stage.id)}
              className="mt-4 w-full flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400"
            >
              <PlusCircle className="w-4 h-4" />
              Add Touchpoint
            </button>

            <select
              value={stage.emotion}
              onChange={(e) => updateStageEmotion(stage.id, e.target.value)}
              className="w-full p-2 border rounded-md bg-white mt-4 text-gray-600"
            >
              {EMOTIONS.map(emotion => (
                <option key={emotion.value} value={emotion.value}>
                  {emotion.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Add Stage Card */}
        <div className="min-w-64 max-w-64 flex-shrink-0 flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300">
          <button
            onClick={addStage}
            className="w-full flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors py-6"
          >
            <PlusCircle className="w-8 h-8" />
            <span className="font-medium">Add Stage</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;