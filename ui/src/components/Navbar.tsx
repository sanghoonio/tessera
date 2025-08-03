import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavLinkProps = {
  page: string;
  title: string;
  position: string;
  currentPage: string;
};

const NavLink = (props: NavLinkProps) => {
  const { page, title, position, currentPage } = props;

  if (position === 'top')
    return (
      <Link
        className={`text-hover cursor-pointer ${currentPage === page || currentPage.startsWith(`${page}/`) ? 'text-dark' : 'text-black-50'}`}
        to={page}
      >
        <p className='fst-condensed mb-0 nav-hover cursor-pointer'>{title}</p>
      </Link>
    );

  return (
    <p
      className={`mb-0 nav-hover ps-2 cursor-pointer rounded-2 position-relative ${currentPage === page || currentPage.startsWith(`${page}/`) ? 'bg-white' : ''}`}
    >
      <Link
        className={`fst-condensed text-decoration-none stretched-link text-hover ${currentPage === page || currentPage.startsWith(`${page}/`) ? 'fw-light' : 'fw-lighter text-black-50'}`}
        style={
          currentPage === page || currentPage.startsWith(`${page}/`)
            ? { color: 'rosybrown' }
            : {}
        }
        to={page}
      >
        {title}
      </Link>
    </p>
  );
};

function Navbar() {
  const location = useLocation().pathname.substring(1) || 'summary';
  const [titleText, setTitleText] = useState('Tessera');

  return (
    <>
      <div className='flex-0 sidebar border-end bg-body-secondary px-2'>
        <div className='row page-width sticky-top'>
          <div className='col-12 p-4'>
            <div className='d-flex'>
              <Link to='' className='text-decoration-none text-dark mx-auto'>
                <h5 
                  className='fst-condensed mt-2 fw-light m-0' 
                  onMouseEnter={() => setTitleText('Tes[seurat]')}
                  onMouseLeave={() => setTitleText('Tessera')}
                >
                  {titleText}
                </h5>
              </Link>
            </div>
            <div className='col-12 text-start'>
              <p className='fst-condensed mt-4 mb-0'>Views</p>
              <div className=''>
                <NavLink
                  page={'summary'}
                  title={'Overview'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'details'}
                  title={'Projections'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'config'}
                  title={'Config'}
                  position='side'
                  currentPage={location}
                />
              </div>

              <p className='fst-condensed mt-3 mb-0'>Links</p>
              <div className=''>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://github.com/sanghoonio/tessera'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    GitHub
                  </p>
                </a>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://satijalab.org/seurat/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    Seurat
                  </p>
                </a>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://idl.uw.edu/mosaic/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    Mosaic
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-0 topbar sticky-top px-2'>
        <div className='row page-width'>
          <div className='col-12 pt-4 px-4 pb-3'>
            <Link to='' className='text-decoration-none text-dark'>
              <h5 
                className='fst-condensed mt-2 fw-light text-center' 
                onMouseEnter={() => setTitleText('Tes[seurat]')}
                onMouseLeave={() => setTitleText('Tessera')}
              >
                {titleText}
              </h5>
            </Link>
            <span
              className='d-inline float-end cursor-pointer dropdown-hover'
              data-bs-toggle='dropdown'
              aria-expanded='false'
            >
              <h5 className='bi bi-three-dots'></h5>
            </span>
            <div className='dropdown-menu px-3 shadow border-0'>
              <p className='fst-condensed mb-0'>Home</p>
              <div className=''>
                <NavLink
                  page={'summary'}
                  title={'Overview'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'details'}
                  title={'Projection'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'config'}
                  title={'Config'}
                  position='side'
                  currentPage={location}
                />
              </div>

              <p className='fst-condensed mt-2 mb-0'>Links</p>
              <div className=''>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://github.com/sanghoonio/tessera'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    GitHub
                  </p>
                </a>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://satijalab.org/seurat/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    Seurat
                  </p>
                </a>
                <a
                  className='text-decoration-none cursor-pointer text-black-50'
                  href='https://idl.uw.edu/mosaic/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <p className='fst-condensed mb-0 nav-hover cursor-pointer text-black-50 fw-lighter ps-2 rounded-2'>
                    Mosaic
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
