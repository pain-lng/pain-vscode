/**
 * Forces all `require('punycode')` calls issued by dependencies to use the userland
 * npm implementation (`punycode/`) instead of Node's deprecated core module and
 * hides any legacy warnings that might slip through before the shim is active.
 */
type ModuleLoader = (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
type ModuleResolver = (request: string, parent: NodeModule | null, isMain: boolean, options?: { paths?: string[] }) => string;
interface ModuleWithInternals {
    _load: ModuleLoader;
    _resolveFilename?: ModuleResolver;
}

const Module = require('module') as ModuleWithInternals;

type GlobalWithPunycodeShim = typeof globalThis & {
    __painPunycodeShimInstalled?: boolean;
    __painPunycodeWarningPatched?: boolean;
};
const globalScope = globalThis as GlobalWithPunycodeShim;

const normalizeRequest = (request: string): string => {
    if (request === 'punycode' || request === 'node:punycode') {
        return 'punycode/';
    }
    return request;
};

if (!globalScope.__painPunycodeShimInstalled) {
    globalScope.__painPunycodeShimInstalled = true;

    try {
        const userland = require('punycode/');
        const originalLoad = Module._load;

        Module._load = function patchedPunycode(this: unknown, request: string, parent: NodeModule | null, isMain: boolean) {
            if (request === 'punycode' || request === 'node:punycode') {
                return userland;
            }
            return originalLoad.call(this, request, parent, isMain);
        };

        if (typeof Module._resolveFilename === 'function') {
            const originalResolve = Module._resolveFilename;
            Module._resolveFilename = function patchedResolve(this: unknown, request: string, parent: NodeModule | null, isMain: boolean, options?: { paths?: string[] }) {
                return originalResolve.call(this, normalizeRequest(request), parent, isMain, options);
            };
        }
    } catch (error) {
        console.warn('Failed to install punycode shim:', error);
    }
}

if (!globalScope.__painPunycodeWarningPatched && typeof process.emitWarning === 'function') {
    globalScope.__painPunycodeWarningPatched = true;

    const originalEmitWarning = process.emitWarning;
    process.emitWarning = function patchedEmitWarning(warning: any, ...args: any[]) {
        const message = typeof warning === 'string'
            ? warning
            : warning && typeof warning.message === 'string'
                ? warning.message
                : '';

        if (message.includes('punycode')) {
            return undefined;
        }

        return originalEmitWarning.call(this, warning, ...args);
    };
}

