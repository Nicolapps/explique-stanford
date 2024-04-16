import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useQuery } from "../usingSession";
import { api } from "../../convex/_generated/api";
import { ArrowRightIcon } from "@heroicons/react/16/solid";

export function ResearchConsent() {
  const hasBeenSet = useQuery(api.researchConsent.hasBeenSet, {});

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

                  <p className="leading-relaxed text-gray-800 my-4">
                    To get access to the platform, please fill in the research
                    consent form on Moodle.
                  </p>

                  <a
                    className="flex gap-1 justify-center items-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white sm:text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700"
                    href="https://go.epfl.ch/CS-250"
                    target="_blank"
                  >
                    Go to Moodle
                    <ArrowRightIcon className="w-5 h-5" />
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
