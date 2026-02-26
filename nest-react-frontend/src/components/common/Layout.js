import React from 'react';
import Header from './Header';
import Footer from './Footer';
import QuickViewModal from './QuickViewModal';
import OnloadModal from './OnloadModal';
import ProgressiveLoader from './ProgressiveLoader';

const Layout = ({ children }) => {
  return (
    <>
      <ProgressiveLoader />
      <Header />
      <main>{children}</main>
      <Footer />
      <QuickViewModal />
      <OnloadModal />
    </>
  );
};

export default Layout;

