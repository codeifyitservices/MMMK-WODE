/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
import { useState, useMemo } from 'react';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
  useRowSelect,
} from 'react-table';
import { FaEdit, FaEye, FaTrashAlt, FaSearch } from 'react-icons/fa';

const blogData = [
  {
    id: 1,
    title: 'First Blog Post',
    description: 'This is the first blog post',
    image:
      'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
  },
  {
    id: 2,
    title: 'Second Blog Post',
    description: 'This is the second blog post',
    image:
      'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
  },
  {
    id: 3,
    title: 'Third Blog Post',
    description: 'This is the third blog post',
    image:
      'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
  },
  // Add more blog data as needed...
];

const BlogTable = () => {
  const [data] = useState(blogData);

  const columns = useMemo(
    () => [
      {
        id: 'selection',
        Header: ({ getToggleAllRowsSelectedProps }) => (
          <input type="checkbox" {...getToggleAllRowsSelectedProps()} />
        ),
        Cell: ({ row }) => (
          <input type="checkbox" {...row.getToggleRowSelectedProps()} />
        ),
      },
      {
        Header: 'S.No',
        accessor: (row, index) => index + 1,
      },
      {
        Header: 'Title',
        accessor: 'title',
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Image',
        accessor: 'image',
        Cell: ({ value }) => (
          <img
            src={value}
            alt="Blog"
            className="object-cover w-12 h-12 rounded"
          />
        ),
      },
      {
        Header: 'Actions',
        Cell: () => (
          <div className="flex space-x-2">
            <FaEye className="w-5 h-5 text-blue-500 cursor-pointer" />
            <FaEdit className="w-5 h-5 text-yellow-500 cursor-pointer" />
            <FaTrashAlt className="w-5 h-5 text-red-500 cursor-pointer" />
          </div>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
    canPreviousPage,
    canNextPage,
    pageIndex,

    nextPage,
    previousPage,
    pageCount,
  } = useTable(
    { columns, data, initialState: { pageIndex: 0 } },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect
  );

  const { globalFilter } = state;

  return (
    <div className="container p-4 mx-auto">
      {/* Search Bar with Icon */}
      <div className="flex items-center justify-start mb-4">
        <FaSearch className="mr-2 text-gray-500" />
        <input
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search blogs..."
          className="max-w-sm p-2 border rounded-3xl"
        />
      </div>

      {/* Table with Borders */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full border-b border-x">
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} className="border-t ">
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-leftm border-x"
                  >
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? ' 🔽'
                          : ' 🔼'
                        : ''}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="border-t">
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      className="px-4 py-2 text-center border-x"
                    >
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          {'<'} Prev
        </button>
        <div>
          Page {pageIndex + 1} of {pageCount}
        </div>
        <button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next {'>'}
        </button>
      </div>
    </div>
  );
};

export default BlogTable;
