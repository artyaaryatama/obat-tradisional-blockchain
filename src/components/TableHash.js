import React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

export default function TableHash({ ipfsHashes = [] }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows
  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - ipfsHashes.length)
      : 0;

  const rowsToDisplay = ipfsHashes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleMouseEnter = (e) => {
    e.target.style.color = "#1d61d6";
    e.target.style.textDecoration = "underline"; 
  };

  const handleMouseLeave = (e) => {
    e.target.style.color = "#1B1C1E";
    e.target.style.textDecoration = "none"; 
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'solid 1px #f2f3f59e', borderRadius: '10px' }}>
      <Table sx={{ minWidth: 500 }} aria-label="IPFS Hashes Table">
        <TableHead sx={{ backgroundColor: '#f2f3f59e' }}>
          <TableRow>
            <TableCell align="left" style={{ width: "30px" }} sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontSize: '14px' }}>
              No.
            </TableCell>
            <TableCell align="left" sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontSize: '14px' }}>
              IPFS Hash
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Check if there are no IPFS hashes */}
          {ipfsHashes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} align="center" sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontSize: '14px', color: '#777' }}>
                Data tidak ditemukan
              </TableCell>
            </TableRow>
          ) : (
            rowsToDisplay.map((hash, index) => (
              <TableRow key={index}>
                <TableCell align="left" sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 'normal', fontStyle: 'normal', fontSize: '12px' }}>
                  {page * rowsPerPage + index + 1}.
                </TableCell>
                <TableCell align="left" sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 'normal', fontStyle: 'normal', fontSize: '12px' }}>
                  <a
                    href={`http://localhost:3000/public/obat/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1B1C1E",          
                      textDecoration: "none",  
                    }}
                    onFocus={(e) => e.target.style.color = '#1B1C1E'}  
                    onBlur={(e) => e.target.style.color = '#1B1C1E'}
                    onMouseEnter={handleMouseEnter}   
                    onMouseLeave={handleMouseLeave}
                  >
                    {hash}
                  </a>
                </TableCell>
              </TableRow>
            ))
          )}

          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={2} sx={{ padding: '8px 16px', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 'normal', fontStyle: 'normal', fontSize: '12px' }}>
                Empty
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              colSpan={2}
              count={ipfsHashes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
              sx={{
                padding: '8px 16px',
                fontFamily: 'Instrument Sans, sans-serif',
                fontSize: '12px',
                backgroundColor: '#f2f3f59e',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '12px',
                  fontWeight: 'bold'
                },
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}