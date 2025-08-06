import { useTableStore } from "../../stores/config";


function Config() {
  const { table, setTable } = useTableStore();


  return (
    <div className='row p-2 p-lg-4 mt-4 mt-lg-0'>
      <div className='col-12'>

        <h5 className='fw-light'>Config</h5>
        <p className='text-ss mb-0 fw-bold mt-4'>DB Table</p>
        <select 
          className='form-select form-select-sm w-25'
          aria-label='groupSelect'
          value={table}
          onChange={(e) => setTable(e.target.value)}
        >
          <option value='ct'>CT</option>
          <option value='sc2'>SC2</option>
          <option value='sc4'>SC4</option>
        </select>
      </div>
    </div>
  );
}

export default Config;
