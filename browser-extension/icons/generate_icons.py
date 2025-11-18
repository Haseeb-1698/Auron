#!/usr/bin/env python3
"""
Generate Auron Security extension icons
"""
import struct

def create_png_icon(size, output_path):
    """
    Create a simple PNG icon with a shield design
    Uses raw PNG format
    """
    # Create a simple colored square with a shield emoji/symbol representation
    # This is a simplified approach - creates a gradient purple background

    width = size
    height = size

    # PNG signature
    png_sig = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # RGB, 8-bit
    ihdr_chunk = b'IHDR' + ihdr_data
    ihdr_crc = struct.pack('>I', crc32(ihdr_chunk))
    ihdr = struct.pack('>I', len(ihdr_data)) + ihdr_chunk + ihdr_crc

    # Create image data - purple gradient with shield shape
    image_data = bytearray()
    for y in range(height):
        image_data.append(0)  # Filter type
        for x in range(width):
            # Create a shield-like shape
            center_x, center_y = width // 2, height // 2
            dx, dy = x - center_x, y - center_y
            dist = (dx * dx + dy * dy) ** 0.5

            # Shield shape logic
            if dist < width * 0.4:
                # Inside shield - gradient purple
                r = int(102 + (y / height) * 16)
                g = int(126 - (y / height) * 16)
                b = int(234 - (y / height) * 92)
            else:
                # Outside - white/transparent
                r, g, b = 255, 255, 255

            image_data.extend([r, g, b])

    # Compress image data (simplified - no actual compression)
    import zlib
    compressed = zlib.compress(bytes(image_data), 9)

    # IDAT chunk
    idat_chunk = b'IDAT' + compressed
    idat_crc = struct.pack('>I', crc32(idat_chunk))
    idat = struct.pack('>I', len(compressed)) + idat_chunk + idat_crc

    # IEND chunk
    iend_chunk = b'IEND'
    iend_crc = struct.pack('>I', crc32(iend_chunk))
    iend = struct.pack('>I', 0) + iend_chunk + iend_crc

    # Write PNG file
    with open(output_path, 'wb') as f:
        f.write(png_sig + ihdr + idat + iend)

def crc32(data):
    """Calculate CRC32 checksum"""
    import binascii
    return binascii.crc32(data) & 0xffffffff

if __name__ == '__main__':
    print("Generating Auron Security extension icons...")
    create_png_icon(16, 'icon16.png')
    print("Created icon16.png")
    create_png_icon(48, 'icon48.png')
    print("Created icon48.png")
    create_png_icon(128, 'icon128.png')
    print("Created icon128.png")
    print("Done!")
