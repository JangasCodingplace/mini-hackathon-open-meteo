import React, { ReactNode } from "react";
import Menu from "./Menu";
import Footer from "./Footer";
import { Box } from "@chakra-ui/react";

type WrapperProps = {
  children: ReactNode;
};

const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <Menu />
      <Box flex="1" p={4}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Wrapper;
