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
            ? { color: '#008066' }
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
  const location = useLocation().pathname.substring(1) || 'details';

  return (
    <>
      <div className='flex-0 sidebar border-end bg-body-secondary px-2'>
        <div className='row page-width sticky-top'>
          <div className='col-12 p-4'>
            <Link to='' className='text-decoration-none text-dark'>
              {/* <img src={logo} alt='Refgenie Logo' className='logo d-block mx-auto' /> */}
              <h5 className='fst-condensed mt-2 fw-light text-center'>Tessera</h5>
            </Link>
            <div className='col-12 text-start'>
              <p className='fst-condensed mt-4 mb-0'>Home</p>
              <div className=''>
                <NavLink
                  page={'details'}
                  title={'Details'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'summary'}
                  title={'Summary'}
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
              {/* <img src={logo} alt='Refgenie Logo' className='logo' /> */}
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
                  page={'about'}
                  title={'About'}
                  position='side'
                  currentPage={location}
                />
                <NavLink
                  page={'summary'}
                  title={'Summary'}
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
