import { useState } from 'react';
import { useConfigStore } from '../../stores/config';


function Config() {
  const { 
    table, 
    connectionType,
    connectionURL,

    setTable,
    setConnectionType,
    setConnectionURL 
  } = useConfigStore();
  const [tableInput, setTableInput] = useState(table);
  const [connectionURLInput, setConnectionURLInput] = useState(connectionURL);

  return (
    <div className='row p-2 p-lg-4 mt-4 mt-lg-0'>
      <div className='col-12'>
        <h5 className='fw-light'>Config</h5>

        <div className='card mt-4 bg-body-tertiary shadow-sm'>
          <div className='card-body'>
            <h6 className='fw-bold'>Server Connection</h6>

            <div className='d-flex flex-row justify-content-between'>
              <div className='w-25'>
                <p className='text-ss mt-3 mb-0 fw-bold'>Connection Type</p>
                <select 
                  className='form-select form-select-sm'
                  aria-label='connectionType'
                  value={connectionType}
                  onChange={(e) => {
                    setConnectionType(e.target.value)
                    setTableInput(table)
                    setConnectionURLInput(connectionURL)
                  }}
                >
                  <option value='wasm'>WebAssembly (in-browser)</option>
                  <option value='websocket'>WebSocket Server</option>
                </select>
              </div>
              <div className='flex-grow-1 ms-2'>
                {connectionType === 'websocket' && (
                  <>
                    <p className='text-ss mt-3 mb-0 fw-bold'>Server URL</p>
                    <input
                      className='form-control form-control-sm'
                      aria-label='connectionURL'
                      value={connectionURLInput}
                      onChange={(e) => setConnectionURLInput(e.target.value)}
                    >
                    </input>
                  </>
                )}
              </div>
            </div>

            <p className='text-ss mt-3 mb-0 fw-bold'>Source Table Name</p>
            {connectionType === 'wasm' ? (
              <select 
                className='form-select form-select-sm w-25'
                aria-label='groupSelect'
                value={table}
                onChange={(e) => setTable(e.target.value)}
              >
                <option value='sample'>sample</option>
                <option value='sample_qc_subset'>sample_qc_subset</option>
                {/* <option value='ct'>CT</option>
                <option value='sc2'>SC2</option>
                <option value='sc4'>SC4</option> */}
              </select>
            ) : (
              <input
                className='form-control form-control-sm'
                aria-label='groupInput'
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
              >
              </input>
            )}

            {connectionType === 'websocket' && (
              <div className='d-flex'>
                <button 
                  className='btn btn-secondary btn-sm mt-4 ms-auto'
                  onClick={() => {
                    setTable(tableInput)
                    setConnectionURL(connectionURLInput)
                  }}
                >
                  Connect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Config;
