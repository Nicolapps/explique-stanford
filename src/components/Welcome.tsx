import { Dialog, Transition } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useEventListener, useIsomorphicLayoutEffect } from "usehooks-ts";
import { useMutation, useQuery } from "../usingSession";
import { api } from "../../convex/_generated/api";

function useStepPosition(
  scrollRef: RefObject<HTMLDivElement>,
  stepsCount: number,
) {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });
  const [scroll, setScroll] = useState({
    left: 0,
    top: 0,
  });

  const handleSize = useCallback(() => {
    setSize({
      width: scrollRef.current?.offsetWidth || 0,
      height: scrollRef.current?.offsetHeight || 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef.current?.offsetHeight, scrollRef.current?.offsetWidth]);

  useEventListener("resize", handleSize);
  useIsomorphicLayoutEffect(() => {
    handleSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef.current?.offsetHeight, scrollRef.current?.offsetWidth]);

  const handleScroll = useCallback(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef.current?.scrollLeft, scrollRef.current?.scrollTo]);
  useEventListener("scroll", handleScroll, scrollRef);

  useEffect(() => {
    if (!scrollRef.current) return undefined;
    const ref = scrollRef.current;

    const onScroll = () => {
      setScroll({
        left: scrollRef.current?.scrollLeft || 0,
        top: scrollRef.current?.scrollTop || 0,
      });
    };

    setTimeout(() => onScroll(), 500);
    ref.addEventListener("scroll", onScroll);
    return () => ref.removeEventListener("scroll", onScroll);
  });

  return {
    currentStep:
      size.width === 0
        ? 0
        : Math.max(
            0,
            Math.min(stepsCount, Math.floor((scroll.left + 20) / size.width)),
          ),
    goToStep(i: number) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          left: size.width * i,
          behavior: "smooth",
        });
      });
    },
  };
}

function Slide({
  isActive,
  onNext,
  children,
}: React.PropsWithChildren<{ isActive: boolean; onNext?: () => void }>) {
  return (
    <div
      className="flex gap-4 flex-col shrink-0 w-full snap-center p-6 pb-11"
      {...{ inert: !isActive ? "inert" : undefined }}
    >
      <div className="flex-grow">{children}</div>

      {/* @TODO Fix bug */}
      {onNext && (
        <Button
          onClick={() => {
            onNext();
          }}
          className="group"
        >
          Next
          <ArrowRightIcon className="w-5 h-5 transition opacity-80 group-hover:opacity-100 group-hover:translate-x-1" />
        </Button>
      )}
    </div>
  );
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        "flex items-center gap-1 justify-center py-3 px-6 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:text-slate-700 ",
        props.className,
      )}
    />
  );
}

function AcademicIntegrity({ onClose }: { onClose: () => void }) {
  const [agree, setAgree] = useState(false);
  const checkboxId = useId();

  return (
    <>
      <div className="flex-grow">
        <div className="prose">
          <h2>Academic Integrity</h2>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Distinctio
            laborum possimus atque accusantium, optio dolores necessitatibus
            recusandae? Eligendi numquam, sed explicabo enim quia, aspernatur
            incidunt, animi vitae neque ad consequatur.
          </p>
        </div>

        <label className="flex gap-3 items-center py-4" htmlFor={checkboxId}>
          <input
            type="checkbox"
            id={checkboxId}
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          Lorem ipsum dolor sit amet
        </label>
      </div>
      <Button onClick={onClose} disabled={!agree}>
        OK
      </Button>
    </>
  );
}

export function Welcome() {
  const STEPS_COUNT = 3;

  const accepted = useQuery(api.welcome.default, {}) ?? true;
  const accept = useMutation(api.welcome.accept);

  const scrollRef = useRef(null);
  const { currentStep, goToStep } = useStepPosition(scrollRef, STEPS_COUNT);

  return (
    <Transition appear show={!accepted} as={Fragment}>
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
                <div className="relative pb-[100%]">
                  <div
                    ref={scrollRef}
                    className="absolute inset-0 flex overflow-x-scroll snap-x snap-mandatory no-scrollbar"
                  >
                    <Slide
                      isActive={currentStep === 0}
                      onNext={() => goToStep(1)}
                    >
                      <p className="text-gray-700 text-4xl leading-snug tracking-tight font-medium">
                        Welcome to the CS-250{" "}
                        <strong className="text-purple-600">
                          Algorithms apprentice
                        </strong>
                        !
                      </p>
                    </Slide>
                    <Slide
                      isActive={currentStep === 1}
                      onNext={() => goToStep(2)}
                    >
                      <p className="text-gray-700 text-2xl leading-snug tracking-tight font-medium">
                        Your goal will be to explain how the algorithms work to
                        your AI friend.
                      </p>
                    </Slide>
                    <Slide isActive={currentStep === 2}>
                      <div className="flex flex-col h-full gap-4">
                        <AcademicIntegrity onClose={() => accept()} />
                      </div>
                    </Slide>
                  </div>

                  <div
                    className="absolute flex gap-2 bottom-4 left-1/2 -translate-x-1/2"
                    title={`Step ${currentStep + 1} of ${STEPS_COUNT}`}
                  >
                    {[...Array(STEPS_COUNT)].map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "w-2 h-2 rounded-full transition-colors",
                          i === currentStep ? "bg-gray-400" : "bg-gray-300",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
