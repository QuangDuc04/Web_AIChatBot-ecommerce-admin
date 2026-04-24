import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'
import Pagination from './Pagination'
import StatsCard from './StatsCard'
import Spinner, { PageLoader } from './Spinner'
import ConfirmDialog from './ConfirmDialog'
import { DollarSign } from 'lucide-react'

// ===== Modal =====
describe('Modal', () => {
  it('không render khi open=false', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}}>Content</Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('render content khi open=true', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        <p>Test Content</p>
      </Modal>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('render title', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Title">
        Content
      </Modal>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('render footer', () => {
    render(
      <Modal open={true} onClose={() => {}} footer={<button>Save</button>}>
        Content
      </Modal>
    )
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('gọi onClose khi click backdrop', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>Content</Modal>
    )
    // Click backdrop (first child of the fixed container)
    const backdrop = document.querySelector('.fixed .absolute')
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('gọi onClose khi click nút X', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="Title">Content</Modal>
    )
    const closeBtn = document.querySelector('button')
    if (closeBtn) fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})

// ===== Pagination =====
describe('Pagination', () => {
  it('không render khi totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} total={5} limit={10} onChange={() => {}} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('render đúng thông tin "Hiển thị"', () => {
    render(
      <Pagination page={1} totalPages={3} total={30} limit={10} onChange={() => {}} />
    )
    expect(screen.getByText('1–10')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('trang 2 hiển thị 11–20', () => {
    render(
      <Pagination page={2} totalPages={3} total={30} limit={10} onChange={() => {}} />
    )
    expect(screen.getByText('11–20')).toBeInTheDocument()
  })

  it('trang cuối hiển thị đúng', () => {
    render(
      <Pagination page={3} totalPages={3} total={25} limit={10} onChange={() => {}} />
    )
    expect(screen.getByText('21–25')).toBeInTheDocument()
  })

  it('gọi onChange khi click số trang', () => {
    const onChange = vi.fn()
    render(
      <Pagination page={1} totalPages={3} total={30} limit={10} onChange={onChange} />
    )
    fireEvent.click(screen.getByText('2'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('disable nút prev ở trang 1', () => {
    render(
      <Pagination page={1} totalPages={3} total={30} limit={10} onChange={() => {}} />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeDisabled()
  })

  it('disable nút next ở trang cuối', () => {
    render(
      <Pagination page={3} totalPages={3} total={30} limit={10} onChange={() => {}} />
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[buttons.length - 1]).toBeDisabled()
  })
})

// ===== StatsCard =====
describe('StatsCard', () => {
  it('render title và value', () => {
    render(<StatsCard title="Doanh thu" value="10.000.000 ₫" icon={<DollarSign />} />)
    expect(screen.getByText('Doanh thu')).toBeInTheDocument()
    expect(screen.getByText('10.000.000 ₫')).toBeInTheDocument()
  })

  it('hiện thay đổi tăng (+)', () => {
    render(<StatsCard title="Test" value={100} icon={<DollarSign />} change={15} />)
    expect(screen.getByText('+15% so với tháng trước')).toBeInTheDocument()
  })

  it('hiện thay đổi giảm (-)', () => {
    render(<StatsCard title="Test" value={100} icon={<DollarSign />} change={-5} />)
    expect(screen.getByText('-5% so với tháng trước')).toBeInTheDocument()
  })

  it('hiện thay đổi không đổi (0)', () => {
    render(<StatsCard title="Test" value={100} icon={<DollarSign />} change={0} />)
    expect(screen.getByText('0% so với tháng trước')).toBeInTheDocument()
  })

  it('hiện subtitle', () => {
    render(<StatsCard title="Test" value={100} icon={<DollarSign />} subtitle="Extra info" />)
    expect(screen.getByText('Extra info')).toBeInTheDocument()
  })
})

// ===== Spinner =====
describe('Spinner', () => {
  it('render spinner element', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('áp dụng custom className', () => {
    const { container } = render(<Spinner className="w-8 h-8 text-red-500" />)
    const el = container.firstElementChild
    expect(el?.className).toContain('w-8')
    expect(el?.className).toContain('h-8')
  })
})

describe('PageLoader', () => {
  it('render text "Đang tải..."', () => {
    render(<PageLoader />)
    expect(screen.getByText('Đang tải...')).toBeInTheDocument()
  })
})

// ===== ConfirmDialog =====
describe('ConfirmDialog', () => {
  it('không render khi open=false', () => {
    const { container } = render(
      <ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('render title và message mặc định', () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} />
    )
    // "Xác nhận" xuất hiện ở cả title (h3) và confirm button
    const matches = screen.getAllByText('Xác nhận')
    expect(matches.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Bạn có chắc chắn muốn thực hiện hành động này?')).toBeInTheDocument()
  })

  it('render title và message tùy chỉnh', () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}}
        title="Xóa sản phẩm" message="Sẽ bị xóa vĩnh viễn" confirmText="Xóa ngay" />
    )
    expect(screen.getByText('Xóa sản phẩm')).toBeInTheDocument()
    expect(screen.getByText('Sẽ bị xóa vĩnh viễn')).toBeInTheDocument()
    expect(screen.getByText('Xóa ngay')).toBeInTheDocument()
  })

  it('gọi onConfirm khi click confirm button', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={onConfirm} confirmText="OK" />
    )
    fireEvent.click(screen.getByText('OK'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('gọi onClose khi click Hủy', () => {
    const onClose = vi.fn()
    render(
      <ConfirmDialog open={true} onClose={onClose} onConfirm={() => {}} />
    )
    fireEvent.click(screen.getByText('Hủy'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hiện spinner khi loading=true', () => {
    const { container } = render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} loading={true} />
    )
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
