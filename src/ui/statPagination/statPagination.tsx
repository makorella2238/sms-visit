import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import "./statPagination.css";

export default function Pagination({
                                       totalCount = 100,
                                       pageSize = 10,
                                       onPageChange,
                                   }) {
    const totalPages = Math.ceil(totalCount / pageSize);

    const navigate = useNavigate();
    const { page = 1 } = useSearch({ from: "/stat" });

    const currentPage = page;

    const changePage = (next: number) => {
        const safePage = Math.min(Math.max(next, 1), totalPages);

        navigate({
            search: (prev) => ({
                ...prev,
                page: safePage,
            }),
            replace: true,
        });

        onPageChange?.(safePage);
    };

    const visiblePages = useMemo(() => {
        let start = Math.max(currentPage - 1, 1);
        let end = start + 2;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(end - 2, 1);
        }

        return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
        );
    }, [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            {/* ←← */}
            <button
                className="nav-btn"
                onClick={() => changePage(currentPage - 3)}
                disabled={currentPage === 1}
            >
                <img src="/stat/skip-prew.svg" alt="" />
            </button>

            {/* ← */}
            <button
                className="nav-btn"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <img src="/stat/skip.svg" alt="" />
            </button>

            {/* pages */}
            {visiblePages.map((p) => (
                <button
                    key={p}
                    className={`page-btn ${p === currentPage ? "active" : ""}`}
                    onClick={() => changePage(p)}
                >
                    {p}
                </button>
            ))}

            {/* → */}
            <button
                className="nav-btn"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <img src="/stat/next.svg" alt="" />
            </button>

            {/* →→ */}
            <button
                className="nav-btn"
                onClick={() => changePage(currentPage + 3)}
                disabled={currentPage === totalPages}
            >
                <img src="/stat/very-next.svg" alt="" />
            </button>
        </div>
    );
}
