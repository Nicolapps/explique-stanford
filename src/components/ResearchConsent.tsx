import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useMutation, useQuery } from "../usingSession";
import { api } from "../../convex/_generated/api";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export function ResearchConsent() {
  const hasBeenSet = useQuery(api.researchConsent.hasBeenSet, {});
  const set = useMutation(api.researchConsent.set);

  const [code, setCode] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  return (
    <Transition
      appear
      show={hasBeenSet !== undefined && !hasBeenSet}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          /* noop */
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="p-6">
                  <p className="text-purple-600 text-4xl leading-snug tracking-tight font-semibold mb-2 ">
                    Welcome to CS-250!
                  </p>

                  <p className="leading-relaxed text-gray-800 my-2">
                    Before you start, please fill in the research consent form
                    on Moodle. After completing it, you will get a code that you
                    can use to access this website.
                  </p>

                  <form
                    className="flex flex-wrap gap-4 mt-4"
                    onSubmit={async (e) => {
                      e.preventDefault();

                      setIsInvalid(false);
                      const { isCorrect } = await set({ code });
                      if (!isCorrect) {
                        setIsInvalid(true);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          className={clsx(
                            "block w-full rounded-md border-0 py-2 px-4 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset h-14",
                            !isInvalid &&
                              "text-gray-900 focus:ring-purple-600 ring-gray-300 placeholder:text-gray-400",
                            isInvalid &&
                              "pr-10 text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500",
                          )}
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.toUpperCase())
                          }
                          placeholder="XXXX-XXXX"
                        />
                        {isInvalid && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ExclamationCircleIcon
                              className="h-5 w-5 text-red-500"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>

                      {isInvalid && (
                        <p className="mt-2 text-sm text-red-600">
                          Invalid code.
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="flex items-center h-14 gap-1 justify-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
                    >
                      OK
                    </button>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
