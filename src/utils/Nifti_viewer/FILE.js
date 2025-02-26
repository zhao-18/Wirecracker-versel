//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//
//  Interface for ArrayBuffer to make translation of MATLAB
//  script easier. This class provides methods to interact
//  with binary data in a manner similar to MATLAB file operations.
//  It supports reading various data types (e.g., integers, floats,
//  strings) from a given ArrayBuffer.
//
//  Developed by Wirecracker team and distributed under MIT license.

export default class FILE
{
    /**
     * Creates an instance of the FILE class.
     * @param {string} [filename] - The name of the file.
     * @param {string} [machine] - The byte order used by the machine ('ieee-le' for little-endian, 'ieee-be' for big-endian).
     */
    constructor( filename = '', machine = 'ieee-le' )
    {
        this.filename = filename;
        this.offset = 0;
        this.littleEndian = machine === 'ieee-le';
    }

    /**
     * Opens a data source and initializes the content buffer.
     * @param {ArrayBuffer} data - The binary data to read from.
     */
    fopen ( data )
    {
        this.content = new DataView(data);
        this.offset = 0;
    }

    /**
     * Closes the file, clearing the content buffer and resetting the offset.
     */
    fclose ()
    {
        this.content = null;
        this.offset = 0;
    }

    /**
     * Reads data from the file at the current offset.
     * @param {number} number - The number of items to read.
     * @param {string} [type=''] - The data type to read (e.g., 'int32', 'float64', 'string', etc.). Defaults to 'uint8'.
     * @returns {any} The read data, either as a single value or an array of values.
     */
    fread ( number, type = '' )
    {
        var result;
        switch ( type )
        {
            case 'int32':
                if ( number == 1 )
                {
                    result = this.content.getInt32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'int16':
                if ( number == 1 )
                {
                    result = this.content.getInt16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case 'char':
            case 'int8':
                if ( number == 1 )
                {
                    result = this.content.getInt8(this.offset, this.littleEndian);
                    this.offset += 1;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getInt8(this.offset, this.littleEndian));
                        this.offset += 1;
                    }
                }
                break;

            case 'uint32':
                if ( number == 1 )
                {
                    result = this.content.getUint32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'uint16':
                if ( number == 1 )
                {
                    result = this.content.getUint16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case '':
            case 'uchar':
            case 'uint8':
                if ( number == 1 )
                {
                    result = this.content.getUint8(this.offset, this.littleEndian);
                    this.offset += 1;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getUint8(this.offset, this.littleEndian));
                        this.offset += 1;
                    }
                }
                break;

            case 'float64':
                if ( number == 1 )
                {
                    result = this.content.getFloat64(this.offset, this.littleEndian);
                    this.offset += 8;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat64(this.offset, this.littleEndian));
                        this.offset += 8;
                    }
                }
                break;

            case 'float32':
                if ( number == 1 )
                {
                    result = this.content.getFloat32(this.offset, this.littleEndian);
                    this.offset += 4;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat32(this.offset, this.littleEndian));
                        this.offset += 4;
                    }
                }
                break;

            case 'float16':
                if ( number == 1 )
                {
                    result = this.content.getFloat16(this.offset, this.littleEndian);
                    this.offset += 2;
                }
                else
                {
                    result = [];
                    for ( var i = 0; i < number; i++ )
                    {
                        result.push(this.content.getFloat16(this.offset, this.littleEndian));
                        this.offset += 2;
                    }
                }
                break;

            case 'string':
                const stringView = new DataView(this.content.buffer, this.offset, number);
                const decoder = new TextDecoder('utf-8');
                result = decoder.decode(stringView).replace(/\0/g, '').trim();
                this.offset += number;
        }
        return result;
    }

    /**
     * Changes the current read/write position in the file.
     * @param {number} offset - The offset to move to.
     * @param {string} origin - The reference point for the offset ('bof' for beginning, 'cof' for current, 'eof' for end).
     */
    fseek ( offset, origin )
    {
        switch ( origin )
        {
            case 'bof': // beginning of file
                this.offset = offset;
                return;

            case 'cof': // current location
                this.offset += offset;
                return;

            case 'eof': // end of file
                this.offset = this.content.byteLength + offset;
                return;
        }
    }

    /**
     * Resets the file pointer to the beginning of the file.
     */
    frewind ()
    {
        this.fseek(0, 'bof');
    }

    /**
     * Gets the current offset within the file.
     * @returns {number} The current file offset.
     */
    ftell ()
    {
        return this.offset;
    }
}
