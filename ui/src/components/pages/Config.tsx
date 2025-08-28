import { useState, useEffect } from 'react';
import * as vg from '@uwdata/vgplot';
import toast from 'react-hot-toast';

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
  const [connectionTypeInput, setConnectionTypeInput] = useState(connectionType);
  const [connectionURLInput, setConnectionURLInput] = useState(connectionURL);
  const [serverTables, setServerTables] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState(false);

  const wasmTables = ['sample_unfiltered'];

  useEffect(() => {
    if (connectionTypeInput === 'websocket') {
      // console.log(connectionURLInput)
      const fetchTables = async () => {
        try {
          const api = vg.createAPIContext({
            coordinator: new vg.Coordinator(vg.socketConnector(connectionURLInput as any))
          });
          
          const result = await api.context.coordinator.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'main'
            ORDER BY table_name
          `) as any;

          const formattedResult = result?.toArray()?.map((tableItem: {table_name: string}) => tableItem.table_name).filter((name: string) => (!name.includes('_expr')));
          // console.log(formattedResult)
          setServerTables(formattedResult)
          setConnectionError(false);
          api.context.coordinator.clear({ clients: true, cache: true });
          if (formattedResult.length > 0) {
            // Only change if current selection is not in the server tables
            if (!formattedResult.includes(tableInput)) {
              setTableInput(formattedResult[0]);
            }
          }
        } catch (error) {
          console.error(error)
          setConnectionError(true);
          setServerTables([]);
        }
      };

      fetchTables();
    }
    
  }, [connectionTypeInput, connectionURLInput])

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
                  value={connectionTypeInput}
                  onChange={(e) => {
                    setConnectionTypeInput(e.target.value)
                    switch (e.target.value) {
                      case 'websocket':
                        setTableInput(table)
                        setConnectionURLInput(connectionURL)
                        break
                      case 'wasm':
                        setTableInput(wasmTables[0])
                        break
                    }
                  }}
                >
                  <option value='wasm'>WebAssembly (in-browser)</option>
                  <option value='websocket'>WebSocket Server</option>
                </select>
              </div>
              <div className='flex-grow-1 ms-2'>
                {connectionTypeInput === 'websocket' && (
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
            {connectionTypeInput === 'wasm' ? (
              <select 
                className='form-select form-select-sm w-25'
                aria-label='groupSelect'
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
              >
                {wasmTables.map((wasmTable: string, index: number) => <option value={wasmTable} key={index}>{wasmTable}</option>)}
                {/* <option value='ct'>CT</option>
                <option value='sc2'>SC2</option>
                <option value='sc4'>SC4</option> */}
              </select>
            ) : (
              <select
                className='form-select form-select-sm w-25'
                aria-label='groupInput'
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                disabled={serverTables.length === 0}
              >
                {serverTables.length === 0 && <option value='' >No tables found.</option>}
                {serverTables.map((serverTable: string, index: number) => <option value={serverTable} key={index}>{serverTable}</option>)}
              </select>
            )}

            <div className='d-flex align-items-end mt-4'>
              <button 
                className='btn btn-secondary btn-sm'
                onClick={() => {
                  setTable(tableInput)
                  setConnectionType(connectionTypeInput)
                  setConnectionURL(connectionURLInput)
                  toast.success('Config Saved.')
                }}
                disabled={(connectionTypeInput === 'websocket') && (serverTables.length === 0) && connectionError}
              >
                Save
              </button>
              <button 
                className='btn btn-danger btn-sm ms-1'
                onClick={() => {
                  setTableInput(table)
                  setConnectionTypeInput(connectionType)
                  setConnectionURLInput(connectionURL)
                }}
              >
                Cancel
              </button>
              <span className='text-ss text-muted fst-italic ms-auto'>Want to use your own data? Follow the instructions <a
                  className='text-decoration-none cursor-pointer text-ss text-dark fst-italic fw-semibold'
                  href='https://github.com/sanghoonio/tessera/tree/main/api'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  here
                </a> to run your own local WebSocket server.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Config;
